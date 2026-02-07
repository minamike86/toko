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

/**
 * Application-level error: entity tidak ditemukan (bukan domain invariant).
 * Dibuat lokal agar patch ini tidak memerlukan file baru.
 */
export class NotFoundError extends Error {
  readonly name = "NotFoundError";
  constructor(public readonly entity: string, public readonly id: string) {
    super(`${entity} not found: ${id}`);
  }
}

export type CreateOrderInput = {
  orderId: string;
  type: OrderType;
  payment: "CASH" | "CREDIT";
  createdBy: string;
  items: Array<{
    productId: string;
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
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderResult> {
    const products = await this.deps.catalogReadRepo.getProductsByIds(
      input.items.map((i) => i.productId)
    );

    const productMap = new Map(products.map((p) => [p.productId, p]));

    const orderItems = input.items.map((line) => {
      const product = productMap.get(line.productId);
      if (!product) {
        // Not Found adalah concern application, bukan domain invariant
        throw new NotFoundError("Product", line.productId);
      }

      if (!product.isActive) {
        throw new InactiveProductError(product.productId);
      }

      return OrderItem.create({
        id: EntityId.of(`${input.orderId}:${product.productId}`),
        productId: EntityId.of(product.productId),
        productNameSnapshot: product.name,
        unitSnapshot: product.unit,
        unitPriceSnapshot: Money.of(product.price),
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

    // simpan fakta awal (CREATED)
    await this.deps.orderRepo.save(order);

    try {
      const requests: IssueStockRequest[] = orderItems.map((item) => ({
        productId: item.productId.toString(),
        quantity: item.quantity.get(),
        reason: "SALE_ORDER",
        referenceId: order.id.toString(),
      }));

      await this.deps.inventoryService.issueStock(requests);
    } catch (error) {
      // inventory gagal → order FAILED
      order.markAsFailed();
      await this.deps.orderRepo.save(order);
      throw error;
    }

    // inventory berhasil → baru tentukan status pembayaran
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
