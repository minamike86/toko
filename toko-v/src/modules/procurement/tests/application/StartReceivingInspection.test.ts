import { describe, expect, it } from "vitest";
import { StartReceivingInspection } from "../../application/use-cases/StartReceivingInspection";
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

  async save(_inspection: ReceivingInspection): Promise<void> {
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

function createInspectionArrived(): ReceivingInspection {
  return ReceivingInspection.create({
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
}

function createInspectionStarted(): ReceivingInspection {
  const inspection = createInspectionArrived();
  inspection.start(new Date(), "warehouse");
  return inspection;
}

describe("StartReceivingInspection", () => {
  it("starts inspection from ARRIVED", async () => {
    const useCase = new StartReceivingInspection(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(createInspectionArrived()),
      new FakeInspectionFlowPolicy(true),
    );

    const result = await useCase.execute({
      receivingInspectionId: "inspection-1",
      startedAt: new Date(),
      actor: {
        actorId: "warehouse",
        role: "WAREHOUSE",
      },
    });

    expect(result.status).toBe("UNDER_INSPECTION");
  });

  it("rejects if inspection not found", async () => {
    const useCase = new StartReceivingInspection(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(null),
      new FakeInspectionFlowPolicy(true),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "not-found",
        startedAt: new Date(),
        actor: {
          actorId: "warehouse",
          role: "WAREHOUSE",
        },
      }),
    ).rejects.toThrow(ReceivingInspectionNotFoundError);
  });

  it("rejects if already started", async () => {
    const useCase = new StartReceivingInspection(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(createInspectionStarted()),
      new FakeInspectionFlowPolicy(true),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        startedAt: new Date(),
        actor: {
          actorId: "warehouse",
          role: "WAREHOUSE",
        },
      }),
    ).rejects.toThrow(ReceivingInspectionStatusInvalidError);
  });

  it("rejects if inspection flow disabled", async () => {
    const useCase = new StartReceivingInspection(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(createInspectionArrived()),
      new FakeInspectionFlowPolicy(false),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        startedAt: new Date(),
        actor: {
          actorId: "warehouse",
          role: "WAREHOUSE",
        },
      }),
    ).rejects.toThrow(InspectionFlowNotEnabledError);
  });

  it("rejects if PO not found", async () => {
    const useCase = new StartReceivingInspection(
      new FakePurchaseOrderRepository(null),
      new FakeReceivingInspectionRepository(createInspectionArrived()),
      new FakeInspectionFlowPolicy(true),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        startedAt: new Date(),
        actor: {
          actorId: "warehouse",
          role: "WAREHOUSE",
        },
      }),
    ).rejects.toThrow(PurchaseOrderNotFoundError);
  });

  it("rejects if PO not CREATED", async () => {
    const po = createPurchaseOrder();
    po.receive({
      receivedAt: new Date(),
      receivedBy: "warehouse",
    });

    const useCase = new StartReceivingInspection(
      new FakePurchaseOrderRepository(po),
      new FakeReceivingInspectionRepository(createInspectionArrived()),
      new FakeInspectionFlowPolicy(true),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        startedAt: new Date(),
        actor: {
          actorId: "warehouse",
          role: "WAREHOUSE",
        },
      }),
    ).rejects.toThrow(PurchaseOrderNotInspectableError);
  });
});