import { randomUUID } from "crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../../shared/prisma";
import { RegisterGoodsArrival } from "../../application/use-cases/RegisterGoodsArrival";
import { InspectionFlowPolicy } from "../../application/ports/InspectionFlowPolicy";
import { ReceivingInspectionAlreadyExistsError } from "../../domain/ReceivingInspectionErrors";
import { PrismaPurchaseOrderRepository } from "../../infrastructure/prisma/PrismaPurchaseOrderRepository";
import { PrismaReceivingInspectionRepository } from "../../infrastructure/prisma/PrismaReceivingInspectionRepository";

class EnabledInspectionFlowPolicy implements InspectionFlowPolicy {
  async isEnabledForPurchaseOrder(): Promise<boolean> {
    return true;
  }
}

async function cleanup(): Promise<void> {
  await prisma.receivingInspectionItem.deleteMany();
  await prisma.receivingInspection.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.supplierPayment.deleteMany();
  await prisma.purchaseReturnReductionItem.deleteMany();
  await prisma.purchaseReturnReduction.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
}

async function seedPurchaseOrder(): Promise<{
  purchaseOrderId: string;
  purchaseItemId: string;
}> {
  const supplierId = randomUUID();
  const purchaseOrderId = randomUUID();
  const purchaseItemId = randomUUID();

  await prisma.supplier.create({
    data: {
      id: supplierId,
      storeName: "Supplier Inspection Test",
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
      productId: "product-1",
      variantId: "variant-1",
      productNameSnapshot: "Product 1",
      variantNameSnapshot: "Variant 1",
      unitSnapshot: "pcs",
      quantity: 10,
      unitCost: 1000,
      subtotalCost: 10000,
    },
  });

  return { purchaseOrderId, purchaseItemId };
}

function createUseCase(): RegisterGoodsArrival {
  return new RegisterGoodsArrival(
    new PrismaPurchaseOrderRepository(prisma),
    new PrismaReceivingInspectionRepository(prisma),
    new EnabledInspectionFlowPolicy(),
  );
}

describe("RegisterGoodsArrival integration", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("creates receiving inspection and keeps purchase order CREATED", async () => {
    const { purchaseOrderId, purchaseItemId } = await seedPurchaseOrder();

    const result = await createUseCase().execute({
      purchaseOrderId,
      arrivedAt: new Date("2026-01-01T01:00:00.000Z"),
      notes: "goods arrived",
      actor: {
        actorId: "warehouse-1",
        role: "WAREHOUSE",
      },
    });

    const inspection = await prisma.receivingInspection.findUnique({
      where: { id: result.receivingInspectionId },
      include: { items: true },
    });

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });

    expect(inspection).not.toBeNull();
    expect(inspection?.purchaseOrderId).toBe(purchaseOrderId);
    expect(inspection?.status).toBe("ARRIVED");
    expect(inspection?.items).toHaveLength(1);
    expect(inspection?.items[0]?.purchaseItemId).toBe(purchaseItemId);
    expect(inspection?.items[0]?.expectedQuantity).toBe(10);
    expect(purchaseOrder?.status).toBe("CREATED");
  });

  it("rejects duplicate arrival and does not create duplicate inspection", async () => {
    const { purchaseOrderId } = await seedPurchaseOrder();
    const useCase = createUseCase();

    const input = {
      purchaseOrderId,
      arrivedAt: new Date("2026-01-01T01:00:00.000Z"),
      notes: null,
      actor: {
        actorId: "warehouse-1",
        role: "WAREHOUSE" as const,
      },
    };

    await useCase.execute(input);

    await expect(() => useCase.execute(input)).rejects.toThrow(
      ReceivingInspectionAlreadyExistsError,
    );

    const inspectionCount = await prisma.receivingInspection.count({
      where: { purchaseOrderId },
    });

    expect(inspectionCount).toBe(1);
  });

  it("does not create inventory movement or payable records", async () => {
    const { purchaseOrderId } = await seedPurchaseOrder();

    await createUseCase().execute({
      purchaseOrderId,
      arrivedAt: new Date("2026-01-01T01:00:00.000Z"),
      notes: null,
      actor: {
        actorId: "warehouse-1",
        role: "WAREHOUSE",
      },
    });

    const stockMovementCount = await prisma.stockMovement.count();
    const supplierPaymentCount = await prisma.supplierPayment.count();
    const returnReductionCount = await prisma.purchaseReturnReduction.count();

    expect(stockMovementCount).toBe(0);
    expect(supplierPaymentCount).toBe(0);
    expect(returnReductionCount).toBe(0);
  });
});