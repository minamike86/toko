import { describe, expect, it, afterEach } from "vitest";

import { prisma } from "@/shared/prisma";
import {
  cleanupPayableSeed,
  seedReceivedPurchaseOrder,
  type PayableSeedIds,
} from "./payableIntegrationSeed";
import { createPayableIntegrationUseCases } from "./payableIntegrationTestFactory";

const ids: PayableSeedIds = {
  supplierId: "SUP-RET-INT-1",
  purchaseOrderId: "PO-RET-INT-1",
  purchaseItemId: "PI-RET-INT-1",
};

describe("HandlePurchaseReturn Prisma Integration", () => {
  afterEach(async () => {
    await cleanupPayableSeed(prisma, ids);
  });

  it("records append-only purchase return reduction and reduces derived outstanding", async () => {
    await seedReceivedPurchaseOrder(prisma, ids, 100_000);

    const { handlePurchaseReturn, getSupplierOutstanding } =
      createPayableIntegrationUseCases(prisma);

    const result = await handlePurchaseReturn.execute({
      purchaseOrderId: ids.purchaseOrderId,
      returnItems: [
        {
          purchaseItemId: ids.purchaseItemId,
          quantity: 3,
          reason: "wrong item",
        },
      ],
      returnedAt: new Date("2026-04-26T00:00:00.000Z"),
      notes: "supplier accepted return",
      actor: {
        actorId: "ADMIN-1",
        role: "ADMIN",
      },
    });

    const returnRows = await prisma.purchaseReturnReduction.findMany({
      where: {
        purchaseOrderId: ids.purchaseOrderId,
      },
      include: {
        items: true,
      },
    });

    const outstanding = await getSupplierOutstanding.execute({
      supplierId: ids.supplierId,
      actor: {
        actorId: "ADMIN-1",
        role: "ADMIN",
      },
    });

    expect(returnRows).toHaveLength(1);
    expect(returnRows[0]?.createdBy).toBe("ADMIN-1");
    expect(returnRows[0]?.items).toHaveLength(1);
    expect(returnRows[0]?.items[0]?.quantity).toBe(3);
    expect(returnRows[0]?.items[0]?.reducedAmount).toBe(30_000);

    expect(result.reducedAmount).toBe(30_000);
    expect(result.outstanding).toBe(70_000);
    expect(outstanding.totalOutstanding).toBe(70_000);
  });
});