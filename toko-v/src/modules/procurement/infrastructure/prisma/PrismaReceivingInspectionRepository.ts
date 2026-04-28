import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { ReceivingInspection } from "../../domain/ReceivingInspection";
import { ReceivingInspectionRepository } from "../../domain/ReceivingInspectionRepository";
import { PrismaReceivingInspectionMapper } from "./mappers/PrismaReceivingInspectionMapper";

export class PrismaReceivingInspectionRepository
  implements ReceivingInspectionRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findById(id: string): Promise<ReceivingInspection | null> {
    const record = await this.prisma.receivingInspection.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!record) {
      return null;
    }

    return PrismaReceivingInspectionMapper.toDomain(record);
  }

  async findByPurchaseOrderId(
    purchaseOrderId: string,
  ): Promise<ReceivingInspection | null> {
    const record = await this.prisma.receivingInspection.findUnique({
      where: { purchaseOrderId },
      include: { items: true },
    });

    if (!record) {
      return null;
    }

    return PrismaReceivingInspectionMapper.toDomain(record);
  }

  async save(inspection: ReceivingInspection): Promise<void> {
    const snapshot = inspection.toSnapshot();

    await this.prisma.receivingInspection.upsert({
      where: { id: snapshot.id },
      create: {
        id: snapshot.id,
        purchaseOrderId: snapshot.purchaseOrderId,
        status: snapshot.status,
        arrivedAt: snapshot.arrivedAt,
        arrivedBy: snapshot.arrivedBy,
        startedAt: snapshot.startedAt,
        startedBy: snapshot.startedBy,
        completedAt: snapshot.completedAt,
        completedBy: snapshot.completedBy,
        notes: snapshot.notes,
        items: {
          create: snapshot.items.map((item) => ({
            id: randomUUID(),
            purchaseItemId: item.purchaseItemId,
            variantId: item.variantId,
            expectedQuantity: item.expectedQuantity,
            acceptedQuantity: item.acceptedQuantity,
            quarantinedQuantity: item.quarantinedQuantity,
            rejectedQuantity: item.rejectedQuantity,
            notes: item.notes,
          })),
        },
      },
      update: {
        status: snapshot.status,
        startedAt: snapshot.startedAt,
        startedBy: snapshot.startedBy,
        completedAt: snapshot.completedAt,
        completedBy: snapshot.completedBy,
        notes: snapshot.notes,
        items: {
          deleteMany: {},
          create: snapshot.items.map((item) => ({
            id: randomUUID(),
            purchaseItemId: item.purchaseItemId,
            variantId: item.variantId,
            expectedQuantity: item.expectedQuantity,
            acceptedQuantity: item.acceptedQuantity,
            quarantinedQuantity: item.quarantinedQuantity,
            rejectedQuantity: item.rejectedQuantity,
            notes: item.notes,
          })),
        },
      },
    });
  }
}