import { randomUUID } from "crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../../shared/prisma";
import { ReceivingInspection } from "../../domain/ReceivingInspection";
import { ReceivingInspectionItem } from "../../domain/ReceivingInspectionItem";
import { PrismaReceivingInspectionRepository } from "../../infrastructure/prisma/PrismaReceivingInspectionRepository";

const repository = new PrismaReceivingInspectionRepository(prisma);

async function cleanup(): Promise<void> {
  await prisma.receivingInspectionItem.deleteMany();
  await prisma.receivingInspection.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
}

async function seedPurchaseOrder(): Promise<{
  purchaseOrderId: string;
  purchaseItemId: string;
  variantId: string;
}> {
  const supplierId = randomUUID();
  const purchaseOrderId = randomUUID();
  const purchaseItemId = randomUUID();
  const productId = randomUUID();
  const variantId = randomUUID();

  await prisma.supplier.create({
    data: {
      id: supplierId,
      storeName: "Supplier Test",
      salesName: null,
      phone: null,
      notes: null,
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      id: purchaseOrderId,
      supplierId,
      status: "CREATED",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      createdBy: "admin-1",
      receivedAt: null,
      receivedBy: null,
      canceledAt: null,
      canceledBy: null,
    },
  });

  await prisma.purchaseItem.create({
    data: {
      id: purchaseItemId,
      purchaseOrderId,
      productId,
      variantId,
      productNameSnapshot: "Product Test",
      variantNameSnapshot: "Variant Test",
      unitSnapshot: "pcs",
      quantity: 10,
      unitCost: 1000,
      subtotalCost: 10000,
    },
  });

  return { purchaseOrderId, purchaseItemId, variantId };
}

describe("PrismaReceivingInspectionRepository", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("saves and loads receiving inspection aggregate with items", async () => {
    const { purchaseOrderId, purchaseItemId, variantId } =
      await seedPurchaseOrder();

    const inspection = ReceivingInspection.create({
      id: randomUUID(),
      purchaseOrderId,
      arrivedAt: new Date("2026-01-01T01:00:00.000Z"),
      arrivedBy: "warehouse-1",
      notes: "arrived with supplier note",
      items: [
        ReceivingInspectionItem.create({
          purchaseItemId,
          variantId,
          expectedQuantity: 10,
        }),
      ],
    });

    await repository.save(inspection);

    const loaded = await repository.findById(inspection.id);

    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(inspection.id);
    expect(loaded?.purchaseOrderId).toBe(purchaseOrderId);
    expect(loaded?.status).toBe("ARRIVED");
    expect(loaded?.items).toHaveLength(1);
    expect(loaded?.items[0]?.purchaseItemId).toBe(purchaseItemId);
    expect(loaded?.items[0]?.expectedQuantity).toBe(10);
  });

  it("updates aggregate status and item inspection result", async () => {
    const { purchaseOrderId, purchaseItemId, variantId } =
      await seedPurchaseOrder();

    const inspection = ReceivingInspection.create({
      id: randomUUID(),
      purchaseOrderId,
      arrivedAt: new Date("2026-01-01T01:00:00.000Z"),
      arrivedBy: "warehouse-1",
      notes: null,
      items: [
        ReceivingInspectionItem.create({
          purchaseItemId,
          variantId,
          expectedQuantity: 10,
        }),
      ],
    });

    await repository.save(inspection);

    inspection.start(new Date("2026-01-01T02:00:00.000Z"), "warehouse-1");
    inspection.complete({
      completedAt: new Date("2026-01-01T03:00:00.000Z"),
      completedBy: "warehouse-1",
      items: [
        {
          purchaseItemId,
          acceptedQuantity: 8,
          quarantinedQuantity: 1,
          rejectedQuantity: 1,
          notes: "one quarantined and one rejected",
        },
      ],
    });

    await repository.save(inspection);

    const loaded = await repository.findByPurchaseOrderId(purchaseOrderId);

    expect(loaded).not.toBeNull();
    expect(loaded?.status).toBe("COMPLETED");
    expect(loaded?.items[0]?.acceptedQuantity).toBe(8);
    expect(loaded?.items[0]?.quarantinedQuantity).toBe(1);
    expect(loaded?.items[0]?.rejectedQuantity).toBe(1);
  });
});