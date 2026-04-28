import { describe, expect, it } from "vitest";
import { CompleteReceivingInspection } from "../../application/use-cases/CompleteReceivingInspection";
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
  PurchaseOrderNotFoundError,
} from "../../application/use-cases/ReceivingInspectionApplicationErrors";
import {
  ReceivingInspectionNotFoundError,
  ReceivingInspectionStatusInvalidError,
  ReceivingInspectionQuantityUnresolvedError,
} from "../../domain/ReceivingInspectionErrors";

class FakePurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly purchaseOrder: PurchaseOrder | null) { }

  nextId(): string {
    return "po-next";
  }

  nextItemId(): string {
    return "poi-next";
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    if (!this.purchaseOrder || this.purchaseOrder.id !== id) {
      return null;
    }
    return this.purchaseOrder;
  }

  async save(): Promise<void> {
    return;
  }
}

class FakeReceivingInspectionRepository implements ReceivingInspectionRepository {
  constructor(private readonly inspection: ReceivingInspection | null) { }

  async findById(): Promise<ReceivingInspection | null> {
    return this.inspection;
  }

  async findByPurchaseOrderId(): Promise<ReceivingInspection | null> {
    return null;
  }

  async save(): Promise<void> {
    return;
  }
}

class FakeInspectionFlowPolicy implements InspectionFlowPolicy {
  constructor(private readonly enabled: boolean) { }

  async isEnabledForPurchaseOrder(): Promise<boolean> {
    return this.enabled;
  }
}

function createPurchaseOrder(): PurchaseOrder {
  return PurchaseOrder.create({
    id: "purchase-order-1",
    supplierId: "supplier-1",
    createdAt: new Date(),
    createdBy: "admin",
    items: [
      PurchaseItem.create({
        id: "purchase-item-1",
        purchaseOrderId: "purchase-order-1",
        productId: "product-1",
        variantId: "variant-1",
        productNameSnapshot: "Product",
        variantNameSnapshot: "Variant",
        unitSnapshot: "pcs",
        quantity: 10,
        unitCost: 1000,
      }),
    ],
  });
}

function createInspectionStarted(): ReceivingInspection {
  const inspection = ReceivingInspection.create({
    id: "inspection-1",
    purchaseOrderId: "purchase-order-1",
    arrivedAt: new Date(),
    arrivedBy: "warehouse",
    notes: null,
    items: [
      ReceivingInspectionItem.create({
        purchaseItemId: "purchase-item-1",
        variantId: "variant-1",
        expectedQuantity: 10,
      }),
    ],
  });

  inspection.start(new Date(), "warehouse");
  return inspection;
}

describe("CompleteReceivingInspection", () => {
  it("completes inspection with valid quantities", async () => {
    const useCase = new CompleteReceivingInspection(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(createInspectionStarted()),
      new FakeInspectionFlowPolicy(true),
    );

    const result = await useCase.execute({
      receivingInspectionId: "inspection-1",
      completedAt: new Date(),
      actor: {
        actorId: "warehouse",
        role: "WAREHOUSE",
      },
      items: [
        {
          purchaseItemId: "purchase-item-1",
          acceptedQuantity: 8,
          quarantinedQuantity: 1,
          rejectedQuantity: 1,
          notes: null,
        },
      ],
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.items[0].acceptedQuantity).toBe(8);
  });

  it("rejects if inspection not found", async () => {
    const useCase = new CompleteReceivingInspection(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(null),
      new FakeInspectionFlowPolicy(true),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "x",
        completedAt: new Date(),
        actor: { actorId: "w", role: "WAREHOUSE" },
        items: [],
      }),
    ).rejects.toThrow(ReceivingInspectionNotFoundError);
  });

  it("rejects if not started", async () => {
    const inspection = ReceivingInspection.create({
      id: "inspection-1",
      purchaseOrderId: "purchase-order-1",
      arrivedAt: new Date(),
      arrivedBy: "warehouse",
      notes: null,
      items: [
        ReceivingInspectionItem.create({
          purchaseItemId: "purchase-item-1",
          variantId: "variant-1",
          expectedQuantity: 10,
        }),
      ],
    });

    const useCase = new CompleteReceivingInspection(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(inspection),
      new FakeInspectionFlowPolicy(true),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        completedAt: new Date(),
        actor: { actorId: "w", role: "WAREHOUSE" },
        items: [],
      }),
    ).rejects.toThrow(ReceivingInspectionStatusInvalidError);
  });

  it("rejects invalid quantity split", async () => {
    const useCase = new CompleteReceivingInspection(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(createInspectionStarted()),
      new FakeInspectionFlowPolicy(true),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        completedAt: new Date(),
        actor: { actorId: "w", role: "WAREHOUSE" },
        items: [
          {
            purchaseItemId: "purchase-item-1",
            acceptedQuantity: 5,
            quarantinedQuantity: 1,
            rejectedQuantity: 1, // total != 10
            notes: null,
          },
        ],
      }),
    ).rejects.toThrow(ReceivingInspectionQuantityUnresolvedError);
  });

  it("rejects if inspection flow disabled", async () => {
    const useCase = new CompleteReceivingInspection(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(createInspectionStarted()),
      new FakeInspectionFlowPolicy(false),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        completedAt: new Date(),
        actor: { actorId: "w", role: "WAREHOUSE" },
        items: [],
      }),
    ).rejects.toThrow(InspectionFlowNotEnabledError);
  });

  it("rejects if PO not CREATED", async () => {
    const po = createPurchaseOrder();
    po.receive({ receivedAt: new Date(), receivedBy: "w" });

    const useCase = new CompleteReceivingInspection(
      new FakePurchaseOrderRepository(po),
      new FakeReceivingInspectionRepository(createInspectionStarted()),
      new FakeInspectionFlowPolicy(true),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        completedAt: new Date(),
        actor: { actorId: "w", role: "WAREHOUSE" },
        items: [],
      }),
    ).rejects.toThrow(PurchaseOrderNotInspectableError);
  });
});