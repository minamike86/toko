import { describe, expect, it, afterEach } from "vitest";

import { prisma } from "@/shared/prisma";
import {
  cleanupPayableSeed,
  seedReceivedPurchaseOrder,
  type PayableSeedIds,
} from "./payableIntegrationSeed";
import { createPayableIntegrationUseCases } from "./payableIntegrationTestFactory";

const ids: PayableSeedIds = {
  supplierId: "SUP-OUT-INT-1",
  purchaseOrderId: "PO-OUT-INT-1",
  purchaseItemId: "PI-OUT-INT-1",
};

describe("GetSupplierOutstanding Prisma Integration", () => {
  afterEach(async () => {
    await cleanupPayableSeed(prisma, ids);
  });

  it("returns derived supplier outstanding from purchase order, payments, and returns", async () => {
    await seedReceivedPurchaseOrder(prisma, ids, 100_000);

    const { recordSupplierPayment, handlePurchaseReturn, getSupplierOutstanding } =
      createPayableIntegrationUseCases(prisma);

    await recordSupplierPayment.execute({
      purchaseOrderId: ids.purchaseOrderId,
      amount: 25_000,
      paidAt: new Date("2026-04-26T00:00:00.000Z"),
      notes: null,
      actor: {
        actorId: "ADMIN-1",
        role: "ADMIN",
      },
    });

    await handlePurchaseReturn.execute({
      purchaseOrderId: ids.purchaseOrderId,
      returnItems: [
        {
          purchaseItemId: ids.purchaseItemId,
          quantity: 2,
          reason: "damaged",
        },
      ],
      returnedAt: new Date("2026-04-27T00:00:00.000Z"),
      notes: null,
      actor: {
        actorId: "ADMIN-1",
        role: "ADMIN",
      },
    });

    const result = await getSupplierOutstanding.execute({
      supplierId: ids.supplierId,
      actor: {
        actorId: "ADMIN-1",
        role: "ADMIN",
      },
    });

    expect(result.supplierId).toBe(ids.supplierId);
    expect(result.totalOutstanding).toBe(55_000);
    expect(result.purchaseOrders).toHaveLength(1);
    expect(result.purchaseOrders[0]).toMatchObject({
      purchaseOrderId: ids.purchaseOrderId,
      payableInitial: 100_000,
      totalPaid: 25_000,
      totalReturned: 20_000,
      outstanding: 55_000,
    });
  });
});