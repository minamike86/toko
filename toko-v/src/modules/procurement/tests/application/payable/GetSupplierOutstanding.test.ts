import { describe, expect, it } from "vitest";

import { GetSupplierOutstanding } from "../../../application/payable/GetSupplierOutstanding";
import { DefaultStep7AuthorizationGuard } from "../../../application/payable/Step7AuthorizationGuard";
import type { SupplierPayableQuery, SupplierOutstandingSummary } from "../../../domain/payable/SupplierPayableQuery";
import type { SupplierPayableReader, SupplierPayableSnapshot } from "../../../domain/payable/SupplierPayableReader";

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

class FakePayableQuery implements SupplierPayableQuery {
  summary: SupplierOutstandingSummary | null = {
    supplierId: "SUP-1",
    supplierStoreName: "Supplier A",
    totalOutstanding: 70_000,
    purchaseOrders: [
      {
        purchaseOrderId: "PO-1",
        receivedAt: new Date("2026-04-01T00:00:00.000Z"),
        payableInitial: 100_000,
        totalPaid: 20_000,
        totalReturned: 10_000,
        outstanding: 70_000,
      },
    ],
  };

  async getOutstandingBySupplierId(): Promise<SupplierOutstandingSummary | null> {
    return this.summary;
  }

  async getOutstandingByPurchaseOrderId() {
    return null;
  }
}

function makeUseCase() {
  const suppliers = new FakeSupplierReader();
  const payableQuery = new FakePayableQuery();

  const useCase = new GetSupplierOutstanding({
    authorization: new DefaultStep7AuthorizationGuard(),
    suppliers,
    payableQuery,
  });

  return { useCase, suppliers, payableQuery };
}

describe("GetSupplierOutstanding", () => {
  it("returns supplier outstanding from derived payable lines", async () => {
    const { useCase } = makeUseCase();

    const result = await useCase.execute({
      supplierId: "SUP-1",
      actor: { actorId: "ADMIN-1", role: "ADMIN" },
    });

    expect(result.totalOutstanding).toBe(70_000);
    expect(result.purchaseOrders[0]?.outstanding).toBe(70_000);
  });

  it("rejects non-admin actor", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        supplierId: "SUP-1",
        actor: { actorId: "SALES-1", role: "SALES" },
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects missing supplier", async () => {
    const { useCase, suppliers } = makeUseCase();
    suppliers.snapshot = null;

    await expect(
      useCase.execute({
        supplierId: "SUP-X",
        actor: { actorId: "ADMIN-1", role: "ADMIN" },
      }),
    ).rejects.toMatchObject({ code: "SUPPLIER_NOT_FOUND" });
  });

  it("returns empty outstanding when supplier has no received payable", async () => {
    const { useCase, payableQuery } = makeUseCase();
    payableQuery.summary = null;

    const result = await useCase.execute({
      supplierId: "SUP-1",
      actor: { actorId: "ADMIN-1", role: "ADMIN" },
    });

    expect(result.totalOutstanding).toBe(0);
    expect(result.purchaseOrders).toHaveLength(0);
  });
});