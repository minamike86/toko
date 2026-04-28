import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { PositiveInt } from "@/shared/value-objects/PositiveInt";
import { NotFoundError } from "@/shared/errors/ApplicationError";
import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import { ActorContext } from "@/shared/system/types/actor-context";

import { Order } from "../domain/Order";
import { OrderItem } from "../domain/OrderItem";
import { OrderRepository } from "../domain/OrderRepository";
import { OrderType } from "../domain/OrderType";

import { CatalogReadRepository } from "@/modules/catalog/domain/CatalogReadRepository";

import {
  InventoryService,
  IssueStockRequest,
} from "@/modules/inventory/application/InventoryService";

import { InactiveProductError } from "../domain/SalesErrors";

export type CreateOrderInput = {
  orderId: string;
  type: OrderType;
  payment: "CASH" | "CREDIT";
  actor: ActorContext;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
};

export type CreateOrderResult = {
  orderId: string;
  status: string;
  totalAmount: number;
  outstandingAmount: number;
};

type Deps = {
  orderRepo: OrderRepository;
  catalogReadRepo: CatalogReadRepository;
  inventoryService: InventoryService;
};

export class CreateOrder {
  constructor(private readonly deps: Deps) { }

  async execute(input: CreateOrderInput): Promise<CreateOrderResult> {
    console.info("[CreateOrder] input:", input);

    const actor = AuthorizationGuard.assertAuthorized(input.actor, [
      "ADMIN",
      "SALES",
    ]);

    const variants = await this.deps.catalogReadRepo.getVariantsByIds(
      input.items.map((item) => item.variantId),
    );

    console.info("[CreateOrder] variants found:", variants);

    const variantMap = new Map(variants.map((variant) => [variant.variantId, variant]));

    const orderItems = input.items.map((line) => {
      const variant = variantMap.get(line.variantId);

      if (!variant) {
        console.error("[CreateOrder] variant not found:", {
          requestedVariantId: line.variantId,
          availableVariantIds: variants.map((item) => item.variantId),
        });

        throw new NotFoundError("ProductVariant", line.variantId);
      }

      if (!variant.isActive) {
        console.error("[CreateOrder] inactive variant:", {
          variantId: variant.variantId,
          productId: variant.productId,
        });

        throw new InactiveProductError(variant.productId);
      }

      return OrderItem.create({
        id: EntityId.of(`${input.orderId}:${variant.variantId}`),
        productId: EntityId.of(variant.productId),
        variantId: EntityId.of(variant.variantId),
        productNameSnapshot: variant.productName,
        unitSnapshot: variant.unit,
        unitPriceSnapshot: Money.of(variant.price),
        quantity: PositiveInt.of(line.quantity),
      });
    });

    const order = Order.create({
      id: EntityId.of(input.orderId),
      type: input.type,
      items: orderItems,
      createdAt: new Date(),
      createdBy: EntityId.of(actor.actorId),
    });

    await this.deps.orderRepo.save(order);

    try {
      const requests: IssueStockRequest[] = orderItems.map((item) => ({
        variantId: item.variantId.toString(),
        quantity: item.quantity.get(),
        reason: "SALE_ORDER",
        referenceId: order.id.toString(),
      }));

      console.info("[CreateOrder] issueStock requests:", requests);

      await this.deps.inventoryService.issueStock(requests);
    } catch (error: unknown) {
      console.error("[CreateOrder] issueStock failed:", error);
      console.error(
        "[CreateOrder] issueStock meta:",
        error instanceof Error
          ? {
            name: error.name,
            message: error.message,
            constructorName: error.constructor.name,
            stack: error.stack,
          }
          : {
            type: typeof error,
            value: error,
          },
      );

      order.markAsFailed();
      await this.deps.orderRepo.save(order);
      throw error;
    }

    if (input.payment === "CASH") {
      order.markAsPaid();
    } else {
      order.markAsCredit();
    }

    await this.deps.orderRepo.save(order);

    return {
      orderId: order.id.toString(),
      status: order.getStatus(),
      totalAmount: order.getTotalAmount().get(),
      outstandingAmount: order.getOutstandingAmount().get(),
    };
  }
}