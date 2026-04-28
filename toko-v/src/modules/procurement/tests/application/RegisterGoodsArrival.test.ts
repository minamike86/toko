import { describe, expect, it } from "vitest";
import { RegisterGoodsArrival } from "../../application/use-cases/RegisterGoodsArrival";
import { InspectionFlowPolicy } from "../../application/ports/InspectionFlowPolicy";
import { PurchaseOrderRepository } from "../../domain/PurchaseOrderRepository";
import { PurchaseOrder } from "../../domain/PurchaseOrder";
import { PurchaseItem } from "../../domain/PurchaseItem";
import { ReceivingInspectionRepository } from "../../domain/ReceivingInspectionRepository";
import { ReceivingInspection } from "../../domain/ReceivingInspection";
import { ReceivingInspectionItem } from "../../domain/ReceivingInspectionItem";
import {
  InspectionFlowNotEnabledError,
  PurchaseOrderNotInspectableError,
} from "../../application/use-cases/ReceivingInspectionApplicationErrors";
import { ReceivingInspectionAlreadyExistsError } from "../../domain/ReceivingInspectionErrors";

class FakePurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly purchaseOrder: PurchaseOrder | null) { }

  nextId(): string {
    return "purchase-order-next-id";
  }

  nextItemId(): string {
    return "purchase-item-next-id";
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    if (!this.purchaseOrder || this.purchaseOrder.id !== id) {
      return null;
    }

    return this.purchaseOrder;
  }

  async save(_purchaseOrder: PurchaseOrder): Promise<void> {
    return;
  }
}

class FakeReceivingInspectionRepository implements ReceivingInspectionRepository {
  public savedInspection: ReceivingInspection | null = null;

  constructor(
    private readonly existingInspection: ReceivingInspection | null = null,
  ) { }

  async findById(_id: string): Promise<ReceivingInspection | null> {
    return null;
  }

  async findByPurchaseOrderId(
    _purchaseOrderId: string,
  ): Promise<ReceivingInspection | null> {
    return this.existingInspection;
  }

  async save(inspection: ReceivingInspection): Promise<void> {
    this.savedInspection = inspection;
  }
}

class FakeInspectionFlowPolicy implements InspectionFlowPolicy {
  constructor(private readonly enabled: boolean) { }

  async isEnabledForPurchaseOrder(_purchaseOrderId: string): Promise<boolean> {
    return this.enabled;
  }
}

function createPurchaseOrder(): PurchaseOrder {
  return PurchaseOrder.create({
    id: "purchase-order-1",
    supplierId: "supplier-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: "admin-1",
    items: [
      PurchaseItem.create({
        id: "purchase-item-1",
        purchaseOrderId: "purchase-order-1",
        productId: "product-1",
        variantId: "variant-1",
        productNameSnapshot: "Product 1",
        variantNameSnapshot: "Variant 1",
        unitSnapshot: "pcs",
        quantity: 10,
        unitCost: 1000,
      }),
    ],
  });
}

function createReceivedPurchaseOrder(): PurchaseOrder {
  const purchaseOrder = createPurchaseOrder();

  purchaseOrder.receive({
    receivedAt: new Date("2026-01-01T01:00:00.000Z"),
    receivedBy: "warehouse-1",
  });

  return purchaseOrder;
}

function createExistingInspection(): ReceivingInspection {
  return ReceivingInspection.create({
    id: "inspection-existing",
    purchaseOrderId: "purchase-order-1",
    arrivedAt: new Date("2026-01-01T00:00:00.000Z"),
    arrivedBy: "warehouse-1",
    notes: null,
    items: [
      ReceivingInspectionItem.create({
        purchaseItemId: "purchase-item-1",
        variantId: "variant-1",
        expectedQuantity: 10,
      }),
    ],
  });
}

describe("RegisterGoodsArrival", () => {
  it("creates receiving inspection from CREATED purchase order", async () => {
    const receivingInspectionRepository =
      new FakeReceivingInspectionRepository();

    const useCase = new RegisterGoodsArrival(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      receivingInspectionRepository,
      new FakeInspectionFlowPolicy(true),
    );

    const result = await useCase.execute({
      purchaseOrderId: "purchase-order-1",
      arrivedAt: new Date("2026-01-01T00:00:00.000Z"),
      notes: null,
      actor: {
        actorId: "warehouse-1",
        role: "WAREHOUSE",
      },
    });

    expect(result.purchaseOrderId).toBe("purchase-order-1");
    expect(result.status).toBe("ARRIVED");
    expect(receivingInspectionRepository.savedInspection).not.toBeNull();
    expect(receivingInspectionRepository.savedInspection?.items).toHaveLength(1);
  });

  it("rejects when inspection flow is not enabled", async () => {
    const useCase = new RegisterGoodsArrival(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(),
      new FakeInspectionFlowPolicy(false),
    );

    await expect(() =>
      useCase.execute({
        purchaseOrderId: "purchase-order-1",
        arrivedAt: new Date("2026-01-01T00:00:00.000Z"),
        notes: null,
        actor: {
          actorId: "warehouse-1",
          role: "WAREHOUSE",
        },
      }),
    ).rejects.toThrow(InspectionFlowNotEnabledError);
  });

  it("rejects non-CREATED purchase order", async () => {
    const useCase = new RegisterGoodsArrival(
      new FakePurchaseOrderRepository(createReceivedPurchaseOrder()),
      new FakeReceivingInspectionRepository(),
      new FakeInspectionFlowPolicy(true),
    );

    await expect(() =>
      useCase.execute({
        purchaseOrderId: "purchase-order-1",
        arrivedAt: new Date("2026-01-01T00:00:00.000Z"),
        notes: null,
        actor: {
          actorId: "warehouse-1",
          role: "WAREHOUSE",
        },
      }),
    ).rejects.toThrow(PurchaseOrderNotInspectableError);
  });

  it("rejects duplicate receiving inspection", async () => {
    const useCase = new RegisterGoodsArrival(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(createExistingInspection()),
      new FakeInspectionFlowPolicy(true),
    );

    await expect(() =>
      useCase.execute({
        purchaseOrderId: "purchase-order-1",
        arrivedAt: new Date("2026-01-01T00:00:00.000Z"),
        notes: null,
        actor: {
          actorId: "warehouse-1",
          role: "WAREHOUSE",
        },
      }),
    ).rejects.toThrow(ReceivingInspectionAlreadyExistsError);
  });

  it("rejects unauthorized actor", async () => {
    const useCase = new RegisterGoodsArrival(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(),
      new FakeInspectionFlowPolicy(true),
    );

    const invalidInput = {
      purchaseOrderId: "purchase-order-1",
      arrivedAt: new Date("2026-01-01T00:00:00.000Z"),
      notes: null,
      actor: {
        actorId: "sales-1",
        role: "SALES",
      },
    } as unknown as Parameters<RegisterGoodsArrival["execute"]>[0];

    await expect(() => useCase.execute(invalidInput)).rejects.toThrow();
  });

});