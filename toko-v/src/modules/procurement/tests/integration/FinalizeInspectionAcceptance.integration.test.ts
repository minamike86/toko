import { randomUUID } from "crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../../shared/prisma";
import { FinalizeInspectionAcceptance } from "../../application/use-cases/FinalizeInspectionAcceptance";
import { InspectionFlowPolicy } from "../../application/ports/InspectionFlowPolicy";
import {
  NonAcceptedInspectionResolutionQuery,
  VerifyNonAcceptedInspectionResolutionInput,
} from "../../application/ports/NonAcceptedInspectionResolutionQuery";
import {
  TransactionContext,
  TransactionRunner,
} from "../../application/ports/TransactionRunner";
import { PrismaPurchaseOrderRepository } from "../../infrastructure/prisma/PrismaPurchaseOrderRepository";
import { PrismaReceivingInspectionRepository } from "../../infrastructure/prisma/PrismaReceivingInspectionRepository";
import { InventoryInspectionAcceptanceAdapter } from "../../infrastructure/InventoryInspectionAcceptanceAdapter";
import { InventoryProcurementAdapter } from "../../infrastructure/InventoryProcurementAdapter";
import { PrismaInventoryRepository } from "../../../inventory/infrastructure/PrismaInventoryRepository";
import { ReceiveStock } from "../../../inventory/application/ReceiveStock";

class EnabledInspectionFlowPolicy implements InspectionFlowPolicy {
  async isEnabledForPurchaseOrder(): Promise<boolean> {
    return true;
  }
}

class ResolvedNonAcceptedInspectionQuery
  implements NonAcceptedInspectionResolutionQuery {
  async isResolved(
    _input: VerifyNonAcceptedInspectionResolutionInput,
  ): Promise<boolean> {
    return true;
  }
}

class PrismaTransactionRunner implements TransactionRunner {
  async runInTransaction<T>(
    callback: (transaction: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return callback({ transactionId: "integration-test-tx" });
  }
}

async function cleanup(): Promise<void> {
  await prisma.receivingInspectionItem.deleteMany();
  await prisma.receivingInspection.deleteMany();

  await prisma.stockMovement.deleteMany();
  await prisma.inventoryItem.deleteMany();

  await prisma.supplierPayment.deleteMany();
  await prisma.purchaseReturnReductionItem.deleteMany();
  await prisma.purchaseReturnReduction.deleteMany();

  await prisma.purchaseItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();

  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();

  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
}

async function seedCompletedInspection(): Promise<{
  purchaseOrderId: string;
  receivingInspectionId: string;
  variantId: string;
}> {
  const supplierId = randomUUID();
  const productId = randomUUID();
  const variantId = randomUUID();
  const purchaseOrderId = randomUUID();
  const purchaseItemId = randomUUID();
  const receivingInspectionId = randomUUID();

  await prisma.product.create({
    data: {
      id: productId,
      name: "Inspection Product",
      brand: null,
      isActive: true,
    },
  });

  await prisma.productVariant.create({
    data: {
      id: variantId,
      productId,
      sku: `SKU-${variantId}`,
      variantName: "Inspection Variant",
      unit: "pcs",
      sizeLabel: null,
      colorLabel: null,
      basePrice: 1000,
      isActive: true,
    },
  });

  await prisma.inventoryItem.create({
    data: {
      variantId,
      quantity: 0,
    },
  });

  await prisma.supplier.create({
    data: {
      id: supplierId,
      storeName: "Supplier Inspection Finalize",
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
      productNameSnapshot: "Inspection Product",
      variantNameSnapshot: "Inspection Variant",
      unitSnapshot: "pcs",
      quantity: 10,
      unitCost: 1000,
      subtotalCost: 10000,
    },
  });

  await prisma.receivingInspection.create({
    data: {
      id: receivingInspectionId,
      purchaseOrderId,
      status: "COMPLETED",
      arrivedAt: new Date("2026-01-01T01:00:00.000Z"),
      arrivedBy: "warehouse-1",
      startedAt: new Date("2026-01-01T02:00:00.000Z"),
      startedBy: "warehouse-1",
      completedAt: new Date("2026-01-01T03:00:00.000Z"),
      completedBy: "warehouse-1",
      notes: null,
      items: {
        create: [
          {
            id: randomUUID(),
            purchaseItemId,
            variantId,
            expectedQuantity: 10,
            acceptedQuantity: 10,
            quarantinedQuantity: 0,
            rejectedQuantity: 0,
            notes: null,
          },
        ],
      },
    },
  });

  return { purchaseOrderId, receivingInspectionId, variantId };
}

function createUseCase(): FinalizeInspectionAcceptance {
  const inventoryRepository = new PrismaInventoryRepository(prisma);
  const receiveStock = new ReceiveStock({
    inventoryRepo: inventoryRepository,
  });

  const inventoryProcurementPort = new InventoryProcurementAdapter(
    receiveStock,
    {
      actorId: "warehouse-1",
      role: "WAREHOUSE",
    },
  );

  const inventoryInspectionAcceptancePort =
    new InventoryInspectionAcceptanceAdapter(inventoryProcurementPort);

  return new FinalizeInspectionAcceptance(
    new PrismaPurchaseOrderRepository(prisma),
    new PrismaReceivingInspectionRepository(prisma),
    new EnabledInspectionFlowPolicy(),
    inventoryInspectionAcceptancePort,
    new ResolvedNonAcceptedInspectionQuery(),
    new PrismaTransactionRunner(),
  );
}

describe("FinalizeInspectionAcceptance integration", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("moves accepted quantity to inventory and marks purchase order RECEIVED", async () => {
    const { purchaseOrderId, receivingInspectionId, variantId } =
      await seedCompletedInspection();

    const result = await createUseCase().execute({
      receivingInspectionId,
      finalizedAt: new Date("2026-01-01T04:00:00.000Z"),
      actor: {
        actorId: "warehouse-1",
        role: "WAREHOUSE",
      },
    });

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { variantId },
    });

    const movement = await prisma.stockMovement.findFirst({
      where: {
        variantId,
        referenceId: purchaseOrderId,
        origin: "PURCHASE",
      },
    });

    const supplierPaymentCount = await prisma.supplierPayment.count({
      where: { purchaseOrderId },
    });

    const returnReductionCount = await prisma.purchaseReturnReduction.count({
      where: { purchaseOrderId },
    });

    expect(result.purchaseOrderStatus).toBe("RECEIVED");
    expect(purchaseOrder?.status).toBe("RECEIVED");
    expect(inventoryItem?.quantity).toBe(10);
    expect(movement).not.toBeNull();
    expect(movement?.quantity).toBe(10);
    expect(supplierPaymentCount).toBe(0);
    expect(returnReductionCount).toBe(0);
  });
});