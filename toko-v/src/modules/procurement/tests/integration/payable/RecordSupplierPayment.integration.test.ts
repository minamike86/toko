import { describe, expect, it, afterEach } from "vitest";

import { prisma } from "@/shared/prisma";
import {
  cleanupPayableSeed,
  seedReceivedPurchaseOrder,
  type PayableSeedIds,
} from "./payableIntegrationSeed";
import { createPayableIntegrationUseCases } from "./payableIntegrationTestFactory";

const ids: PayableSeedIds = {
  supplierId: "SUP-PAY-INT-1",
  purchaseOrderId: "PO-PAY-INT-1",
  purchaseItemId: "PI-PAY-INT-1",
};

describe("RecordSupplierPayment Prisma Integration", () => {
  afterEach(async () => {
    await cleanupPayableSeed(prisma, ids);
  });

  it("records supplier payment and updates derived outstanding", async () => {
    await seedReceivedPurchaseOrder(prisma, ids, 100_000);

    const { recordSupplierPayment, getSupplierOutstanding } =
      createPayableIntegrationUseCases(prisma);

    const result = await recordSupplierPayment.execute({
      purchaseOrderId: ids.purchaseOrderId,
      amount: 30_000,
      paidAt: new Date("2026-04-26T00:00:00.000Z"),
      notes: "bank transfer",
      actor: {
        actorId: "ADMIN-1",
        role: "ADMIN",
      },
    });

    const paymentRows = await prisma.supplierPayment.findMany({
      where: {
        purchaseOrderId: ids.purchaseOrderId,
      },
    });

    const outstanding = await getSupplierOutstanding.execute({
      supplierId: ids.supplierId,
      actor: {
        actorId: "ADMIN-1",
        role: "ADMIN",
      },
    });

    expect(paymentRows).toHaveLength(1);
    expect(paymentRows[0]?.amount).toBe(30_000);
    expect(paymentRows[0]?.createdBy).toBe("ADMIN-1");

    expect(result.outstanding).toBe(70_000);
    expect(outstanding.totalOutstanding).toBe(70_000);
    expect(outstanding.purchaseOrders[0]?.outstanding).toBe(70_000);
  });
});