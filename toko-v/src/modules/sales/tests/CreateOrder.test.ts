import { describe, it, expect, beforeEach } from "vitest";

import { CreateOrder } from "@/modules/sales/application/CreateOrder";
import { OrderRepository } from "@/modules/sales/domain/OrderRepository";
import { Order } from "@/modules/sales/domain/Order";
import { OrderType } from "@/modules/sales/domain/OrderType";
import {
  CatalogReadRepository,
  CatalogProductSnapshot,
  CatalogVariantReadModel,
} from "@/modules/catalog/domain/CatalogReadRepository";
import {
  InventoryService,
  IssueStockRequest,
} from "@/modules/inventory/application/InventoryService";
import { EntityId } from "@/shared/value-objects/EntityId";

class InMemoryOrderRepository implements OrderRepository {
  private readonly store = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.store.set(order.id.toString(), order);
  }

  async findById(id: EntityId, _tx?: unknown): Promise<Order | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async saveWithVersionCheck(): Promise<void> {
    throw new Error("not used in this test");
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

  private readonly variants: CatalogVariantReadModel[] = [
    {
      variantId: "V001",
      productId: "P001",
      productName: "Produk Test",
      unit: "pcs",
      price: 10000,
      isActive: true,
    },
  ];

  async getProductsByIds(ids: string[]): Promise<CatalogProductSnapshot[]> {
    return this.products.filter((p) => ids.includes(p.productId));
  }

  async getVariantsByIds(ids: string[]): Promise<CatalogVariantReadModel[]> {
    return this.variants.filter((v) => ids.includes(v.variantId));
  }
}

class SpyInventoryService implements InventoryService {
  public issued: IssueStockRequest[] = [];
  public shouldFail = false;

  async issueStock(requests: IssueStockRequest[]): Promise<void> {
    if (this.shouldFail) {
      throw new Error("inventory gagal");
    }

    this.issued.push(...requests);
  }

  async returnStock(_requests: IssueStockRequest[]): Promise<void> {
    // tidak dipakai di test ini
  }
}

describe("CreateOrder Use Case", () => {
  let orderRepo: InMemoryOrderRepository;
  let catalogReadRepo: FakeCatalogReadRepository;
  let inventoryService: SpyInventoryService;
  let useCase: CreateOrder;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    catalogReadRepo = new FakeCatalogReadRepository();
    inventoryService = new SpyInventoryService();

    useCase = new CreateOrder({
      orderRepo,
      catalogReadRepo,
      inventoryService,
    });
  });

  it("membuat order CASH dan langsung PAID", async () => {
    const result = await useCase.execute({
      orderId: "ORD-100",
      type: OrderType.OFFLINE,
      payment: "CASH",
      createdBy: "USER-1",
      items: [{ variantId: "V001", quantity: 2 }],
    });

    expect(result.orderId).toBe("ORD-100");
    expect(result.status).toBe("PAID");
    expect(result.totalAmount).toBe(20000);
    expect(result.outstandingAmount).toBe(0);

    const savedOrder = await orderRepo.findById(EntityId.of("ORD-100"));
    expect(savedOrder).not.toBeNull();
    expect(savedOrder!.getStatus()).toBe("PAID");

    expect(inventoryService.issued).toHaveLength(1);
    expect(inventoryService.issued[0]).toEqual({
      variantId: "V001",
      quantity: 2,
      reason: "SALE_ORDER",
      referenceId: "ORD-100",
    });
  });

  it("membuat order CREDIT dan berstatus ON_CREDIT", async () => {
    const result = await useCase.execute({
      orderId: "ORD-101",
      type: OrderType.OFFLINE,
      payment: "CREDIT",
      createdBy: "USER-1",
      items: [{ variantId: "V001", quantity: 2 }],
    });

    expect(result.orderId).toBe("ORD-101");
    expect(result.status).toBe("ON_CREDIT");
    expect(result.totalAmount).toBe(20000);
    expect(result.outstandingAmount).toBe(20000);

    const savedOrder = await orderRepo.findById(EntityId.of("ORD-101"));
    expect(savedOrder).not.toBeNull();
    expect(savedOrder!.getStatus()).toBe("ON_CREDIT");

    expect(inventoryService.issued).toHaveLength(1);
    expect(inventoryService.issued[0]).toEqual({
      variantId: "V001",
      quantity: 2,
      reason: "SALE_ORDER",
      referenceId: "ORD-101",
    });
  });

  it("menandai order sebagai FAILED jika inventory gagal", async () => {
    inventoryService.shouldFail = true;

    await expect(
      useCase.execute({
        orderId: "ORD-102",
        type: OrderType.OFFLINE,
        payment: "CASH",
        createdBy: "USER-1",
        items: [{ variantId: "V001", quantity: 2 }],
      })
    ).rejects.toThrow("inventory gagal");

    const failedOrder = await orderRepo.findById(EntityId.of("ORD-102"));
    expect(failedOrder).not.toBeNull();
    expect(failedOrder!.getStatus()).toBe("FAILED");
  });

  it("melempar NotFoundError jika variant tidak ditemukan", async () => {
    await expect(
      useCase.execute({
        orderId: "ORD-103",
        type: OrderType.OFFLINE,
        payment: "CASH",
        createdBy: "USER-1",
        items: [{ variantId: "VX99", quantity: 1 }],
      })
    ).rejects.toMatchObject({
      name: "NotFoundError",
      message: "ProductVariant not found: VX99",
    });
  });
});