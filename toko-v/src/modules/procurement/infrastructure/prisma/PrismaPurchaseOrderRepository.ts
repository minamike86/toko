import { randomUUID } from "crypto";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
import { PrismaPurchaseOrderMapper } from "./mappers/PrismaPurchaseOrderMapper";
import { prisma } from "@/shared/prisma";

export class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
  nextId(): string {
    return randomUUID();
  }

  nextItemId(): string {
    return randomUUID();
  }

  async save(order: PurchaseOrder): Promise<void> {
    const data = PrismaPurchaseOrderMapper.toPersistence(order);

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.upsert({
        where: { id: data.id },
        create: {
          id: data.id,
          supplierId: data.supplierId,
          status: data.status,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
          receivedAt: data.receivedAt,
          receivedBy: data.receivedBy,
          canceledAt: data.canceledAt,
          canceledBy: data.canceledBy,
        },
        update: {
          supplierId: data.supplierId,
          status: data.status,
          receivedAt: data.receivedAt,
          receivedBy: data.receivedBy,
          canceledAt: data.canceledAt,
          canceledBy: data.canceledBy,
        },
      });

      await tx.purchaseItem.deleteMany({
        where: {
          purchaseOrderId: data.id,
        },
      });

      if (data.items.length > 0) {
        await tx.purchaseItem.createMany({
          data: data.items.map((item) => ({
            id: item.id,
            purchaseOrderId: item.purchaseOrderId,
            productId: item.productId,
            variantId: item.variantId,
            productNameSnapshot: item.productNameSnapshot,
            variantNameSnapshot: item.variantNameSnapshot,
            unitSnapshot: item.unitSnapshot,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotalCost: item.subtotalCost,
          })),
        });
      }
    });
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const record = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    return PrismaPurchaseOrderMapper.toDomain(record);
  }
}