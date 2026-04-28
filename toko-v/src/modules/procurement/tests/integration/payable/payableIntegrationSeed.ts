import type { PrismaClient } from "@prisma/client";

export type PayableSeedIds = {
  supplierId: string;
  purchaseOrderId: string;
  purchaseItemId: string;
};

export async function seedReceivedPurchaseOrder(
  prisma: PrismaClient,
  ids: PayableSeedIds,
  totalCost: number,
): Promise<void> {
  await prisma.supplier.create({
    data: {
      id: ids.supplierId,
      storeName: "Supplier Payable Test",
      salesName: "Sales Supplier",
      phone: "08123456789",
      notes: null,
      isActive: true,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      id: ids.purchaseOrderId,
      supplierId: ids.supplierId,
      status: "RECEIVED",
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      createdBy: "ADMIN-SEED",
      receivedAt: new Date("2026-04-02T00:00:00.000Z"),
      receivedBy: "ADMIN-SEED",
      canceledAt: null,
      canceledBy: null,
      items: {
        create: [
          {
            id: ids.purchaseItemId,
            productId: `PROD-${ids.purchaseItemId}`,
            variantId: `VAR-${ids.purchaseItemId}`,
            productNameSnapshot: "Payable Test Product",
            variantNameSnapshot: "Default",
            unitSnapshot: "pcs",
            quantity: 10,
            unitCost: totalCost / 10,
            subtotalCost: totalCost,
          },
        ],
      },
    },
  });
}

export async function cleanupPayableSeed(
  prisma: PrismaClient,
  ids: PayableSeedIds,
): Promise<void> {
  await prisma.purchaseReturnReductionItem.deleteMany({
    where: {
      purchaseReturn: {
        purchaseOrderId: ids.purchaseOrderId,
      },
    },
  });

  await prisma.purchaseReturnReduction.deleteMany({
    where: {
      purchaseOrderId: ids.purchaseOrderId,
    },
  });

  await prisma.supplierPayment.deleteMany({
    where: {
      purchaseOrderId: ids.purchaseOrderId,
    },
  });

  await prisma.purchaseItem.deleteMany({
    where: {
      purchaseOrderId: ids.purchaseOrderId,
    },
  });

  await prisma.purchaseOrder.deleteMany({
    where: {
      id: ids.purchaseOrderId,
    },
  });

  await prisma.supplier.deleteMany({
    where: {
      id: ids.supplierId,
    },
  });
}