import { ReceivingInspection } from "../../../domain/ReceivingInspection";
import { PrismaReceivingInspectionItemMapper } from "./PrismaReceivingInspectionItemMapper";

type PrismaReceivingInspectionRecord = {
  id: string;
  purchaseOrderId: string;
  status: string;
  arrivedAt: Date;
  arrivedBy: string;
  startedAt: Date | null;
  startedBy: string | null;
  completedAt: Date | null;
  completedBy: string | null;
  notes: string | null;
  items: Array<{
    purchaseItemId: string;
    variantId: string;
    expectedQuantity: number;
    acceptedQuantity: number;
    quarantinedQuantity: number;
    rejectedQuantity: number;
    notes: string | null;
  }>;
};

export class PrismaReceivingInspectionMapper {
  static toDomain(record: PrismaReceivingInspectionRecord): ReceivingInspection {
    if (
      record.status !== "ARRIVED" &&
      record.status !== "UNDER_INSPECTION" &&
      record.status !== "COMPLETED"
    ) {
      throw new Error(`Invalid ReceivingInspection status from persistence: ${record.status}`);
    }

    return ReceivingInspection.fromSnapshot({
      id: record.id,
      purchaseOrderId: record.purchaseOrderId,
      status: record.status,
      arrivedAt: record.arrivedAt,
      arrivedBy: record.arrivedBy,
      startedAt: record.startedAt,
      startedBy: record.startedBy,
      completedAt: record.completedAt,
      completedBy: record.completedBy,
      notes: record.notes,
      items: record.items.map((item) =>
        PrismaReceivingInspectionItemMapper.toDomain(item),
      ),
    });
  }
}