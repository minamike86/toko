import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { PositiveInt } from "@/shared/value-objects/PositiveInt";

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

export class NotFoundError extends Error {
  readonly name = "NotFoundError";

  constructor(public readonly entity: string, public readonly id: string) {
    super(`${entity} not found: ${id}`);
  }
}

type CatalogVariantView = {
  variantId: string;
  productId: string;
  productName: string;
  unit: string;
  price: number;
  isActive: boolean;
};

export type CreateOrderInput = {
  orderId: string;
  type: OrderType;
  payment: "CASH" | "CREDIT";
  createdBy: string;
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
    const variants = await this.deps.catalogReadRepo.getVariantsByIds(
      input.items.map((i) => i.variantId)
    );

    const variantMap = new Map(variants.map((v) => [v.variantId, v]));

    const orderItems = input.items.map((line) => {
      const variant = variantMap.get(line.variantId);

      if (!variant) {
        throw new NotFoundError("ProductVariant", line.variantId);
      }

      if (!variant.isActive) {
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
      createdBy: EntityId.of(input.createdBy),
    });

    await this.deps.orderRepo.save(order);

    try {
      const requests: IssueStockRequest[] = orderItems.map((item) => ({
        variantId: item.variantId.toString(),
        quantity: item.quantity.get(),
        reason: "SALE_ORDER",
        referenceId: order.id.toString(),
      }));

      await this.deps.inventoryService.issueStock(requests);
    } catch (error) {
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