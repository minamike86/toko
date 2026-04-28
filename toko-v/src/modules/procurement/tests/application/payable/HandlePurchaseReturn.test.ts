import { describe, expect, it } from "vitest";

import { HandlePurchaseReturn } from "../../../application/payable/HandlePurchaseReturn";
import { DefaultStep7AuthorizationGuard } from "../../../application/payable/Step7AuthorizationGuard";
import type { Step7UnitOfWork } from "../../../application/payable/Step7UnitOfWork";
import type { PurchaseOrderPayableReader, PurchaseOrderPayableSnapshot } from "../../../domain/payable/PurchaseOrderPayableReader";
import type { SupplierPayableReader, SupplierPayableSnapshot } from "../../../domain/payable/SupplierPayableReader";
import type { SupplierPaymentRepository } from "../../../domain/payable/SupplierPaymentRepository";
import type { PurchaseReturnRepository } from "../../../domain/payable/PurchaseReturnRepository";
import type { PurchaseReturnReductionRecord } from "../../../domain/payable/PurchaseReturnReduction";

class ImmediateUnitOfWork implements Step7UnitOfWork {
  async runInTransaction<T>(operation: () => Promise<T>): Promise<T> {
    return operation();
  }
}

class FakePurchaseOrderReader implements PurchaseOrderPayableReader {
  snapshot: PurchaseOrderPayableSnapshot | null = {
    id: "PO-1",
    supplierId: "SUP-1",
    status: "RECEIVED",
    receivedAt: new Date("2026-04-01T00:00:00.000Z"),
    totalCost: 100_000,
    items: [
      {
        purchaseItemId: "PI-1",
        quantity: 10,
        unitCost: 10_000,
        subtotalCost: 100_000,
      },
    ],
  };

  async findPayableSnapshotById(): Promise<PurchaseOrderPayableSnapshot | null> {
    return this.snapshot;
  }
}

class FakeSupplierReader implements SupplierPayableReader {
  snapshot: SupplierPayableSnapshot | null = {
    id: "SUP-1",
    storeName: "Supplier A",
    isActive: true,
  };

  async findPayableSnapshotById(): Promise<SupplierPayableSnapshot | null> {
    return this.snapshot;
  }
}

class FakePaymentRepository implements SupplierPaymentRepository {
  paid = 20_000;

  async nextId(): Promise<string> {
    return "PAY-1";
  }

  async save(): Promise<void> { }

  async listByPurchaseOrderId(): Promise<[]> {
    return [];
  }

  async sumPaidByPurchaseOrderId(): Promise<number> {
    return this.paid;
  }
}

class FakeReturnRepository implements PurchaseReturnRepository {
  saved: PurchaseReturnReductionRecord | null = null;
  returnedAmount = 10_000;
  returnedQuantity = 1;

  async nextId(): Promise<string> {
    return "RET-1";
  }

  async save(returnReduction: PurchaseReturnReductionRecord): Promise<void> {
    this.saved = returnReduction;
  }

  async listByPurchaseOrderId(): Promise<[]> {
    return [];
  }

  async sumReturnedByPurchaseOrderId(): Promise<number> {
    return this.returnedAmount;
  }

  async sumReturnedQuantityByPurchaseItemId(): Promise<number> {
    return this.returnedQuantity;
  }
}

function makeUseCase() {
  const purchaseOrders = new FakePurchaseOrderReader();
  const suppliers = new FakeSupplierReader();
  const payments = new FakePaymentRepository();
  const returns = new FakeReturnRepository();

  const useCase = new HandlePurchaseReturn({
    authorization: new DefaultStep7AuthorizationGuard(),
    unitOfWork: new ImmediateUnitOfWork(),
    purchaseOrders,
    suppliers,
    payments,
    returns,
    context: {
      now: () => new Date("2026-04-26T00:00:00.000Z"),
    },
  });

  return { useCase, purchaseOrders, suppliers, payments, returns };
}

describe("HandlePurchaseReturn", () => {
  it("records purchase return reduction and returns derived outstanding", async () => {
    const { useCase, returns } = makeUseCase();

    const result = await useCase.execute({
      purchaseOrderId: "PO-1",
      returnItems: [
        {
          purchaseItemId: "PI-1",
          quantity: 2,
          reason: "damaged",
        },
      ],
      returnedAt: new Date("2026-04-26T00:00:00.000Z"),
      notes: "supplier return",
      actor: { actorId: "ADMIN-1", role: "ADMIN" },
    });

    expect(result.reducedAmount).toBe(20_000);
    expect(result.totalReturned).toBe(30_000);
    expect(result.outstanding).toBe(50_000);
    expect(returns.saved?.createdBy).toBe("ADMIN-1");
  });

  it("rejects non-admin actor", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-1",
        returnItems: [{ purchaseItemId: "PI-1", quantity: 1, reason: null }],
        returnedAt: new Date(),
        notes: null,
        actor: { actorId: "WAREHOUSE-1", role: "WAREHOUSE" },
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects non-received purchase order", async () => {
    const { useCase, purchaseOrders } = makeUseCase();
    purchaseOrders.snapshot = {
      id: "PO-1",
      supplierId: "SUP-1",
      status: "CREATED",
      receivedAt: null,
      totalCost: 100_000,
      items: [],
    };

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-1",
        returnItems: [{ purchaseItemId: "PI-1", quantity: 1, reason: null }],
        returnedAt: new Date(),
        notes: null,
        actor: { actorId: "ADMIN-1", role: "ADMIN" },
      }),
    ).rejects.toMatchObject({ code: "PURCHASE_ORDER_NOT_RECEIVED" });
  });

  it("rejects return item that does not exist in purchase order", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-1",
        returnItems: [{ purchaseItemId: "PI-X", quantity: 1, reason: null }],
        returnedAt: new Date(),
        notes: null,
        actor: { actorId: "ADMIN-1", role: "ADMIN" },
      }),
    ).rejects.toMatchObject({ code: "PURCHASE_RETURN_ITEM_INVALID" });
  });

  it("rejects return quantity exceeding remaining item quantity", async () => {
    const { useCase, returns } = makeUseCase();
    returns.returnedQuantity = 9;

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-1",
        returnItems: [{ purchaseItemId: "PI-1", quantity: 2, reason: null }],
        returnedAt: new Date(),
        notes: null,
        actor: { actorId: "ADMIN-1", role: "ADMIN" },
      }),
    ).rejects.toMatchObject({
      code: "PURCHASE_RETURN_EXCEEDS_ALLOWED_REDUCTION",
    });
  });

  it("rejects return reduction greater than outstanding", async () => {
    const { useCase, payments, returns } = makeUseCase();
    payments.paid = 80_000;
    returns.returnedAmount = 10_000;
    returns.returnedQuantity = 0;

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-1",
        returnItems: [{ purchaseItemId: "PI-1", quantity: 2, reason: null }],
        returnedAt: new Date(),
        notes: null,
        actor: { actorId: "ADMIN-1", role: "ADMIN" },
      }),
    ).rejects.toMatchObject({
      code: "PURCHASE_RETURN_REDUCTION_EXCEEDS_OUTSTANDING",
    });
  });
});