import { describe, expect, it } from "vitest";
import { FinalizeInspectionAcceptance } from "../../application/use-cases/FinalizeInspectionAcceptance";
import { InspectionFlowPolicy } from "../../application/ports/InspectionFlowPolicy";
import { InventoryInspectionAcceptancePort } from "../../application/ports/InventoryInspectionAcceptancePort";
import {
  NonAcceptedInspectionResolutionQuery,
  VerifyNonAcceptedInspectionResolutionInput,
} from "../../application/ports/NonAcceptedInspectionResolutionQuery";
import {
  TransactionContext,
  TransactionRunner,
} from "../../application/ports/TransactionRunner";
import { PurchaseOrderRepository } from "../../domain/PurchaseOrderRepository";
import { PurchaseOrder } from "../../domain/PurchaseOrder";
import { PurchaseItem } from "../../domain/PurchaseItem";
import { ReceivingInspectionRepository } from "../../domain/ReceivingInspectionRepository";
import { ReceivingInspection } from "../../domain/ReceivingInspection";
import { ReceivingInspectionItem } from "../../domain/ReceivingInspectionItem";
import {
  FinalAcceptanceBlockedByPendingRejectionError,
  FinalAcceptanceBlockedByQuarantineError,
  InspectionFlowNotEnabledError,
  PurchaseOrderNotFinalizableError,
} from "../../application/use-cases/ReceivingInspectionApplicationErrors";
import {
  ReceivingInspectionNotFoundError,
  ReceivingInspectionStatusInvalidError,
} from "../../domain/ReceivingInspectionErrors";

class FakePurchaseOrderRepository implements PurchaseOrderRepository {
  public savedPurchaseOrder: PurchaseOrder | null = null;

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

  async save(purchaseOrder: PurchaseOrder): Promise<void> {
    this.savedPurchaseOrder = purchaseOrder;
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

class FakeInventoryInspectionAcceptancePort
  implements InventoryInspectionAcceptancePort {
  public called = false;

  async receiveAcceptedItems(): Promise<void> {
    this.called = true;
  }
}

class FakeNonAcceptedInspectionResolutionQuery
  implements NonAcceptedInspectionResolutionQuery {
  constructor(private readonly resolved: boolean) { }

  async isResolved(
    _input: VerifyNonAcceptedInspectionResolutionInput,
  ): Promise<boolean> {
    return this.resolved;
  }
}

class FakeTransactionRunner implements TransactionRunner {
  async runInTransaction<T>(
    callback: (transaction: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return callback({ transactionId: "tx-1" });
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

function createCompletedInspection(params?: {
  acceptedQuantity?: number;
  quarantinedQuantity?: number;
  rejectedQuantity?: number;
}): ReceivingInspection {
  const acceptedQuantity = params?.acceptedQuantity ?? 10;
  const quarantinedQuantity = params?.quarantinedQuantity ?? 0;
  const rejectedQuantity = params?.rejectedQuantity ?? 0;

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
  inspection.complete({
    completedAt: new Date(),
    completedBy: "warehouse",
    items: [
      {
        purchaseItemId: "purchase-item-1",
        acceptedQuantity,
        quarantinedQuantity,
        rejectedQuantity,
        notes: null,
      },
    ],
  });

  return inspection;
}

describe("FinalizeInspectionAcceptance", () => {
  it("finalizes accepted inspection and marks purchase order RECEIVED", async () => {
    const purchaseOrderRepository = new FakePurchaseOrderRepository(
      createPurchaseOrder(),
    );
    const inventoryPort = new FakeInventoryInspectionAcceptancePort();

    const useCase = new FinalizeInspectionAcceptance(
      purchaseOrderRepository,
      new FakeReceivingInspectionRepository(createCompletedInspection()),
      new FakeInspectionFlowPolicy(true),
      inventoryPort,
      new FakeNonAcceptedInspectionResolutionQuery(true),
      new FakeTransactionRunner(),
    );

    const result = await useCase.execute({
      receivingInspectionId: "inspection-1",
      finalizedAt: new Date(),
      actor: {
        actorId: "warehouse",
        role: "WAREHOUSE",
      },
    });

    expect(result.purchaseOrderStatus).toBe("RECEIVED");
    expect(result.acceptedItems).toHaveLength(1);
    expect(inventoryPort.called).toBe(true);
    expect(purchaseOrderRepository.savedPurchaseOrder?.status).toBe("RECEIVED");
  });

  it("rejects if inspection not found", async () => {
    const useCase = new FinalizeInspectionAcceptance(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(null),
      new FakeInspectionFlowPolicy(true),
      new FakeInventoryInspectionAcceptancePort(),
      new FakeNonAcceptedInspectionResolutionQuery(true),
      new FakeTransactionRunner(),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "missing",
        finalizedAt: new Date(),
        actor: { actorId: "warehouse", role: "WAREHOUSE" },
      }),
    ).rejects.toThrow(ReceivingInspectionNotFoundError);
  });

  it("rejects if inspection is not COMPLETED", async () => {
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

    const useCase = new FinalizeInspectionAcceptance(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(inspection),
      new FakeInspectionFlowPolicy(true),
      new FakeInventoryInspectionAcceptancePort(),
      new FakeNonAcceptedInspectionResolutionQuery(true),
      new FakeTransactionRunner(),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        finalizedAt: new Date(),
        actor: { actorId: "warehouse", role: "WAREHOUSE" },
      }),
    ).rejects.toThrow(ReceivingInspectionStatusInvalidError);
  });

  it("rejects if inspection flow is disabled", async () => {
    const useCase = new FinalizeInspectionAcceptance(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(createCompletedInspection()),
      new FakeInspectionFlowPolicy(false),
      new FakeInventoryInspectionAcceptancePort(),
      new FakeNonAcceptedInspectionResolutionQuery(true),
      new FakeTransactionRunner(),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        finalizedAt: new Date(),
        actor: { actorId: "warehouse", role: "WAREHOUSE" },
      }),
    ).rejects.toThrow(InspectionFlowNotEnabledError);
  });

  it("rejects if purchase order is not CREATED", async () => {
    const purchaseOrder = createPurchaseOrder();
    purchaseOrder.receive({
      receivedAt: new Date(),
      receivedBy: "warehouse",
    });

    const useCase = new FinalizeInspectionAcceptance(
      new FakePurchaseOrderRepository(purchaseOrder),
      new FakeReceivingInspectionRepository(createCompletedInspection()),
      new FakeInspectionFlowPolicy(true),
      new FakeInventoryInspectionAcceptancePort(),
      new FakeNonAcceptedInspectionResolutionQuery(true),
      new FakeTransactionRunner(),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        finalizedAt: new Date(),
        actor: { actorId: "warehouse", role: "WAREHOUSE" },
      }),
    ).rejects.toThrow(PurchaseOrderNotFinalizableError);
  });

  it("rejects if there is quarantined quantity", async () => {
    const useCase = new FinalizeInspectionAcceptance(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(
        createCompletedInspection({
          acceptedQuantity: 9,
          quarantinedQuantity: 1,
          rejectedQuantity: 0,
        }),
      ),
      new FakeInspectionFlowPolicy(true),
      new FakeInventoryInspectionAcceptancePort(),
      new FakeNonAcceptedInspectionResolutionQuery(true),
      new FakeTransactionRunner(),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        finalizedAt: new Date(),
        actor: { actorId: "warehouse", role: "WAREHOUSE" },
      }),
    ).rejects.toThrow(FinalAcceptanceBlockedByQuarantineError);
  });

  it("rejects if rejected quantity is not resolved", async () => {
    const useCase = new FinalizeInspectionAcceptance(
      new FakePurchaseOrderRepository(createPurchaseOrder()),
      new FakeReceivingInspectionRepository(
        createCompletedInspection({
          acceptedQuantity: 9,
          quarantinedQuantity: 0,
          rejectedQuantity: 1,
        }),
      ),
      new FakeInspectionFlowPolicy(true),
      new FakeInventoryInspectionAcceptancePort(),
      new FakeNonAcceptedInspectionResolutionQuery(false),
      new FakeTransactionRunner(),
    );

    await expect(() =>
      useCase.execute({
        receivingInspectionId: "inspection-1",
        finalizedAt: new Date(),
        actor: { actorId: "warehouse", role: "WAREHOUSE" },
      }),
    ).rejects.toThrow(FinalAcceptanceBlockedByPendingRejectionError);
  });
});