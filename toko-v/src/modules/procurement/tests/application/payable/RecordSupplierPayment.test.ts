import { describe, expect, it } from "vitest";

import { RecordSupplierPayment } from "../../../application/payable/RecordSupplierPayment";
import { DefaultStep7AuthorizationGuard } from "../../../application/payable/Step7AuthorizationGuard";
import type { Step7UnitOfWork } from "../../../application/payable/Step7UnitOfWork";
import type { PurchaseOrderPayableReader, PurchaseOrderPayableSnapshot } from "../../../domain/payable/PurchaseOrderPayableReader";
import type { SupplierPayableReader, SupplierPayableSnapshot } from "../../../domain/payable/SupplierPayableReader";
import type { SupplierPaymentRepository } from "../../../domain/payable/SupplierPaymentRepository";
import type { PurchaseReturnRepository } from "../../../domain/payable/PurchaseReturnRepository";
import type { SupplierPaymentRecord } from "../../../domain/payable/SupplierPayment";
import { Step7BusinessError } from "../../../domain/payable/Step7Errors";

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
    items: [],
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
  saved: SupplierPaymentRecord | null = null;
  paid = 20_000;

  async nextId(): Promise<string> {
    return "PAY-1";
  }

  async save(payment: SupplierPaymentRecord): Promise<void> {
    this.saved = payment;
  }

  async listByPurchaseOrderId(): Promise<SupplierPaymentRecord[]> {
    return [];
  }

  async sumPaidByPurchaseOrderId(): Promise<number> {
    return this.paid;
  }
}

class FakeReturnRepository implements PurchaseReturnRepository {
  returned = 10_000;

  async nextId(): Promise<string> {
    return "RET-1";
  }

  async save(): Promise<void> { }

  async listByPurchaseOrderId(): Promise<[]> {
    return [];
  }

  async sumReturnedByPurchaseOrderId(): Promise<number> {
    return this.returned;
  }

  async sumReturnedQuantityByPurchaseItemId(): Promise<number> {
    return 0;
  }
}

function makeUseCase() {
  const purchaseOrders = new FakePurchaseOrderReader();
  const suppliers = new FakeSupplierReader();
  const payments = new FakePaymentRepository();
  const returns = new FakeReturnRepository();

  const useCase = new RecordSupplierPayment({
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

describe("RecordSupplierPayment", () => {
  it("records supplier payment and returns derived outstanding", async () => {
    const { useCase, payments } = makeUseCase();

    const result = await useCase.execute({
      purchaseOrderId: "PO-1",
      amount: 30_000,
      paidAt: new Date("2026-04-26T00:00:00.000Z"),
      notes: "transfer",
      actor: { actorId: "ADMIN-1", role: "ADMIN" },
    });

    expect(result.outstanding).toBe(40_000);
    expect(result.totalPaid).toBe(50_000);
    expect(payments.saved?.amount).toBe(30_000);
    expect(payments.saved?.createdBy).toBe("ADMIN-1");
  });

  it("rejects non-admin actor", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-1",
        amount: 10_000,
        paidAt: new Date(),
        notes: null,
        actor: { actorId: "SALES-1", role: "SALES" },
      }),
    ).rejects.toBeInstanceOf(Step7BusinessError);
  });

  it("rejects missing purchase order", async () => {
    const { useCase, purchaseOrders } = makeUseCase();
    purchaseOrders.snapshot = null;

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-X",
        amount: 10_000,
        paidAt: new Date(),
        notes: null,
        actor: { actorId: "ADMIN-1", role: "ADMIN" },
      }),
    ).rejects.toMatchObject({ code: "PURCHASE_ORDER_NOT_FOUND" });
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
        amount: 10_000,
        paidAt: new Date(),
        notes: null,
        actor: { actorId: "ADMIN-1", role: "ADMIN" },
      }),
    ).rejects.toMatchObject({ code: "PURCHASE_ORDER_NOT_RECEIVED" });
  });

  it("rejects non-positive payment amount", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-1",
        amount: 0,
        paidAt: new Date(),
        notes: null,
        actor: { actorId: "ADMIN-1", role: "ADMIN" },
      }),
    ).rejects.toMatchObject({ code: "INVALID_SUPPLIER_PAYMENT_AMOUNT" });
  });

  it("rejects payment greater than outstanding", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-1",
        amount: 80_000,
        paidAt: new Date(),
        notes: null,
        actor: { actorId: "ADMIN-1", role: "ADMIN" },
      }),
    ).rejects.toMatchObject({
      code: "SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING",
    });
  });
});