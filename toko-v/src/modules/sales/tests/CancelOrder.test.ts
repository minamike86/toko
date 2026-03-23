import { describe, it, expect, beforeEach } from "vitest";

import { CancelOrder } from "@/modules/sales/application/CancelOrder";
import { CreateOrder } from "@/modules/sales/application/CreateOrder";
import { Order } from "@/modules/sales/domain/Order";
import { OrderItem } from "@/modules/sales/domain/OrderItem";
import { OrderRepository } from "@/modules/sales/domain/OrderRepository";
import { OrderStatus } from "@/modules/sales/domain/OrderStatus";
import { OrderType } from "@/modules/sales/domain/OrderType";
import {
  CatalogReadRepository,
  CatalogProductSnapshot,
} from "@/modules/catalog/domain/CatalogReadRepository";

import {
  InventoryService,
  IssueStockRequest,
} from "@/modules/inventory/application/InventoryService";

import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { PositiveInt } from "@/shared/value-objects/PositiveInt";

import { NotFoundError } from "@/shared/errors/ApplicationError";
import { OptimisticLockConflictError } from "@/modules/sales/domain/SalesErrors";

/* ======================================================
   Test Doubles
   ====================================================== */

class InMemoryOrderRepository implements OrderRepository {
  private readonly store = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.store.set(order.id.toString(), order);
  }

  async findById(id: EntityId, _tx?: unknown): Promise<Order | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async saveWithVersionCheck(
    order: Order,
    expectedVersion: number,
    _tx?: unknown
  ): Promise<void> {
    const existing = this.store.get(order.id.toString());
    const currentVersion = existing?.getVersion();

    if (currentVersion === undefined || currentVersion !== expectedVersion) {
      throw new OptimisticLockConflictError();
    }

    order._incrementVersion();
    this.store.set(order.id.toString(), order);
  }
}

class FakeCatalogReadRepository implements CatalogReadRepository {
  private readonly products: CatalogProductSnapshot[] = [
    {
      productId: "P001",
      name: "Produk Test",
      unit: "pcs",
      price: 10000,
      isActive: true,
    },
  ];

  async getProductsByIds(ids: string[]): Promise<CatalogProductSnapshot[]> {
    return this.products.filter((p) => ids.includes(p.productId));
  }
}

class SpyInventoryService implements InventoryService {
  public issued: IssueStockRequest[] = [];
  public returned: IssueStockRequest[] = [];

  async issueStock(requests: IssueStockRequest[]): Promise<void> {
    this.issued.push(...requests);
  }

  async returnStock(requests: IssueStockRequest[]): Promise<void> {
    this.returned.push(...requests);
  }
}

/* ======================================================
   Tests
   ====================================================== */

describe("CancelOrder Use Case", () => {
  let useCase: CancelOrder;
  let orderRepo: InMemoryOrderRepository;
  let inventoryService: SpyInventoryService;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    inventoryService = new SpyInventoryService();

    useCase = new CancelOrder({
      orderRepo,
      inventoryService,
    });
  });

  it("cancels CREATED order tanpa menyentuh inventory", async () => {
    const order = Order.create({
      id: EntityId.of("ORD-300"),
      type: OrderType.OFFLINE,
      items: [
        OrderItem.create({
          id: EntityId.of("ITEM-1"),
          productId: EntityId.of("P001"),
          productNameSnapshot: "Produk Test",
          unitSnapshot: "pcs",
          unitPriceSnapshot: Money.of(10000),
          quantity: PositiveInt.of(1),
        }),
      ],
      createdAt: new Date(),
      createdBy: EntityId.of("USER-1"),
    });

    await orderRepo.save(order);

    const result = await useCase.execute({
      orderId: "ORD-300",
      canceledBy: "USER-1",
    });

    expect(result.status).toBe(OrderStatus.CANCELED);
    expect(inventoryService.issued).toHaveLength(0);
    expect(inventoryService.returned).toHaveLength(0);
  });

  it("cancels PAID order dan mengembalikan stok", async () => {
    const createOrder = new CreateOrder({
      orderRepo,
      catalogReadRepo: new FakeCatalogReadRepository(),
      inventoryService,
    });

    await createOrder.execute({
      orderId: "ORD-301",
      type: OrderType.OFFLINE,
      payment: "CASH",
      createdBy: "USER-1",
      items: [{ productId: "P001", quantity: 2 }],
    });

    inventoryService.issued = [];
    inventoryService.returned = [];

    const result = await useCase.execute({
      orderId: "ORD-301",
      canceledBy: "USER-1",
    });

    expect(result.status).toBe(OrderStatus.CANCELED);
    expect(inventoryService.returned).toHaveLength(1);

    expect(inventoryService.returned[0]).toEqual({
      productId: "P001",
      quantity: 2,
      reason: "CANCEL_ORDER",
      referenceId: "ORD-301",
    });
  });

  it("throws NotFoundError when order does not exist", async () => {
    await expect(
      useCase.execute({ orderId: "missing-id", canceledBy: "user-1" })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});