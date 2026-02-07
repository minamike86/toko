import { describe, it, expect } from "vitest";

import { CreateOrder } from "@/modules/sales/application/CreateOrder";
import { OrderType } from "@/modules/sales/domain/OrderType";
import { OrderRepository } from "@/modules/sales/domain/OrderRepository";
import { Order } from "@/modules/sales/domain/Order";

import {
  CatalogReadRepository,
  CatalogProductSnapshot,
} from "@/modules/catalog/domain/CatalogReadRepository";

import {
  InventoryService,
  IssueStockRequest,
} from "@/modules/inventory/application/InventoryService";

import { EntityId } from "@/shared/value-objects/EntityId";

/* ===== Test Doubles ===== */

class InMemoryOrderRepository implements OrderRepository {
  private readonly store = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.store.set(order.id.toString(), order);
  }

  async findById(id: EntityId): Promise<Order | null> {
    return this.store.get(id.toString()) ?? null;
  }
}

class FakeCatalogReadRepository implements CatalogReadRepository {
  private readonly products: CatalogProductSnapshot[] = [
    {
      productId: "P001",
      name: "Produk Test",
      unit: "pcs",
      price: 15000,
      isActive: true,
    },
  ];

  async getProductsByIds(
    ids: string[]
  ): Promise<CatalogProductSnapshot[]> {
    return this.products.filter((p) => ids.includes(p.productId));
  }
}

class SpyInventoryService implements InventoryService {
  issued: IssueStockRequest[] = [];
  returned: IssueStockRequest[] = [];

  async issueStock(requests: IssueStockRequest[]): Promise<void> {
    this.issued.push(...requests);
  }

  async returnStock(requests: IssueStockRequest[]): Promise<void> {
    this.returned.push(...requests);
  }
}

class FailingInventoryService implements InventoryService {
  async issueStock(): Promise<void> {
    throw new Error("Insufficient stock");
  }

  async returnStock(): Promise<void> {
    // sengaja kosong
    // test ini tidak membutuhkan rollback stock
  }
}

/* ===== Tests ===== */

describe("CreateOrder Use Case", () => {
  it("membuat order CASH dan langsung PAID", async () => {
    const useCase = new CreateOrder({
      orderRepo: new InMemoryOrderRepository(),
      catalogReadRepo: new FakeCatalogReadRepository(),
      inventoryService: new SpyInventoryService(),
    });

    const result = await useCase.execute({
      orderId: "ORD-001",
      type: OrderType.OFFLINE,
      payment: "CASH",
      createdBy: "USER-1",
      items: [{ productId: "P001", quantity: 2 }],
    });

    expect(result.status).toBe("PAID");
    expect(result.totalAmount).toBe(30000);
    expect(result.outstandingAmount).toBe(0);
  });

  it("membuat order CREDIT dan berstatus ON_CREDIT", async () => {
    const useCase = new CreateOrder({
      orderRepo: new InMemoryOrderRepository(),
      catalogReadRepo: new FakeCatalogReadRepository(),
      inventoryService: new SpyInventoryService(),
    });

    const result = await useCase.execute({
      orderId: "ORD-002",
      type: OrderType.OFFLINE,
      payment: "CREDIT",
      createdBy: "USER-1",
      items: [{ productId: "P001", quantity: 1 }],
    });

    expect(result.status).toBe("ON_CREDIT");
    expect(result.outstandingAmount).toBe(15000);
  });

  it("menandai order sebagai FAILED jika inventory gagal", async () => {
    const orderRepo = new InMemoryOrderRepository();

    const useCase = new CreateOrder({
      orderRepo,
      catalogReadRepo: new FakeCatalogReadRepository(),
      inventoryService: new FailingInventoryService(),
    });

    await expect(
      useCase.execute({
        orderId: "ORD-003",
        type: OrderType.OFFLINE,
        payment: "CASH",
        createdBy: "USER-1",
        items: [{ productId: "P001", quantity: 1 }],
      })
    ).rejects.toThrow();

    const failedOrder = await orderRepo.findById(
      EntityId.of("ORD-003")
    );

    expect(failedOrder).not.toBeNull();
    expect(failedOrder!.getStatus()).toBe("FAILED");
  });
});
