import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";

import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
import { PrismaPurchaseOrderMapper } from "./mappers/PrismaPurchaseOrderMapper";
import { prisma as sharedPrisma } from "@/shared/prisma";

export class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaClient = sharedPrisma) { }

  nextId(): string {
    return randomUUID();
  }

  nextItemId(): string {
    return randomUUID();
  }

  async save(purchaseOrder: PurchaseOrder): Promise<void> {
    const data = PrismaPurchaseOrderMapper.toPersistence(purchaseOrder);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findUnique({
        where: {
          id: data.id,
        },
      });

      if (!existing) {
        await tx.purchaseOrder.create({
          data: {
            id: data.id,
            supplierId: data.supplierId,
            status: data.status,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
            receivedAt: data.receivedAt,
            receivedBy: data.receivedBy,
            canceledAt: data.canceledAt,
            canceledBy: data.canceledBy,
            items: {
              create: data.items.map((item) => ({
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                productNameSnapshot: item.productNameSnapshot,
                variantNameSnapshot: item.variantNameSnapshot,
                unitSnapshot: item.unitSnapshot,
                quantity: item.quantity,
                unitCost: item.unitCost,
                subtotalCost: item.subtotalCost,
              })),
            },
          },
        });

        return;
      }

      await tx.purchaseOrder.update({
        where: {
          id: data.id,
        },
        data: {
          status: data.status,
          receivedAt: data.receivedAt,
          receivedBy: data.receivedBy,
          canceledAt: data.canceledAt,
          canceledBy: data.canceledBy,
        },
      });
    });
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const record = await this.prisma.purchaseOrder.findUnique({
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