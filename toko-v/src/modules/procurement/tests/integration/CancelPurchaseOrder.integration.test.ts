import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { CancelPurchaseOrder } from "@/modules/procurement/application/use-cases/CancelPurchaseOrder";
import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PURCHASE_ORDER_STATUSES } from "@/modules/procurement/domain/PurchaseOrderStatus";
import { PurchaseOrderCannotBeCanceledError } from "@/modules/procurement/domain/ProcurementErrors";
import { PrismaPurchaseOrderRepository } from "@/modules/procurement/infrastructure/prisma/PrismaPurchaseOrderRepository";
import { prisma } from "@/shared/prisma";

function makeCreatedPurchaseOrder(id: string): PurchaseOrder {
  return PurchaseOrder.create({
    id,
    supplierId: "SUP-001",
    items: [
      PurchaseItem.create({
        id: `${id}-ITEM-001`,
        purchaseOrderId: id,
        productId: "PROD-001",
        variantId: "VAR-001",
        productNameSnapshot: "Produk A",
        variantNameSnapshot: "Varian A",
        unitSnapshot: "pcs",
        quantity: 5,
        unitCost: 10000,
      }),
    ],
    createdAt: new Date("2026-04-06T10:00:00.000Z"),
    createdBy: "ADMIN-001",
  });
}

function makeReceivedPurchaseOrder(id: string): PurchaseOrder {
  return PurchaseOrder.rehydrate({
    id,
    supplierId: "SUP-001",
    status: PURCHASE_ORDER_STATUSES.RECEIVED,
    items: [
      PurchaseItem.create({
        id: `${id}-ITEM-001`,
        purchaseOrderId: id,
        productId: "PROD-001",
        variantId: "VAR-001",
        productNameSnapshot: "Produk A",
        variantNameSnapshot: "Varian A",
        unitSnapshot: "pcs",
        quantity: 5,
        unitCost: 10000,
      }),
    ],
    createdAt: new Date("2026-04-06T10:00:00.000Z"),
    createdBy: "ADMIN-001",
    receivedAt: new Date("2026-04-06T11:00:00.000Z"),
    receivedBy: "WAREHOUSE-001",
    canceledAt: null,
    canceledBy: null,
  });
}

describe("CancelPurchaseOrder integration", () => {
  const purchaseOrderRepository = new PrismaPurchaseOrderRepository();
  const useCase = new CancelPurchaseOrder({
    purchaseOrderRepo: purchaseOrderRepository,
  });

  beforeEach(async () => {

    await prisma.purchaseReturnReductionItem.deleteMany();
    await prisma.purchaseReturnReduction.deleteMany();
    await prisma.supplierPayment.deleteMany();

    await prisma.purchaseItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.supplier.deleteMany();

    await prisma.supplier.create({
      data: {
        id: "SUP-001",
        storeName: "Supplier A",
        salesName: "Budi",
        phone: "08123456789",
        notes: null,
        isActive: true,
        createdAt: new Date("2026-04-06T09:00:00.000Z"),
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists CANCELED status and cancel audit fields", async () => {
    const order = makeCreatedPurchaseOrder("PO-CANCEL-001");
    await purchaseOrderRepository.save(order);

    const result = await useCase.execute({
      purchaseOrderId: "PO-CANCEL-001",
      actor: {
        actorId: "ADMIN-001",
        role: "ADMIN",
      },
    });

    expect(result.purchaseOrderId).toBe("PO-CANCEL-001");
    expect(result.status).toBe(PURCHASE_ORDER_STATUSES.CANCELED);
    expect(result.canceledBy).toBe("ADMIN-001");
    expect(result.canceledAt).toBeInstanceOf(Date);

    const saved = await prisma.purchaseOrder.findUniqueOrThrow({
      where: { id: "PO-CANCEL-001" },
    });

    expect(saved.status).toBe(PURCHASE_ORDER_STATUSES.CANCELED);
    expect(saved.canceledAt).toBeInstanceOf(Date);
    expect(saved.canceledBy).toBe("ADMIN-001");
    expect(saved.receivedAt).toBeNull();
    expect(saved.receivedBy).toBeNull();
  });

  it("rejects cancel when purchase order is already RECEIVED", async () => {
    const order = makeReceivedPurchaseOrder("PO-RECEIVED-001");
    await purchaseOrderRepository.save(order);

    await expect(
      useCase.execute({
        purchaseOrderId: "PO-RECEIVED-001",
        actor: {
          actorId: "ADMIN-001",
          role: "ADMIN",
        },
      }),
    ).rejects.toBeInstanceOf(PurchaseOrderCannotBeCanceledError);

    const saved = await prisma.purchaseOrder.findUniqueOrThrow({
      where: { id: "PO-RECEIVED-001" },
    });

    expect(saved.status).toBe(PURCHASE_ORDER_STATUSES.RECEIVED);
    expect(saved.canceledAt).toBeNull();
    expect(saved.canceledBy).toBeNull();
    expect(saved.receivedAt).not.toBeNull();
    expect(saved.receivedBy).toBe("WAREHOUSE-001");
  });
});