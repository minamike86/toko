import { ReceivingInspectionItem } from "../../../domain/ReceivingInspectionItem";

type PrismaReceivingInspectionItemRecord = {
  purchaseItemId: string;
  variantId: string;
  expectedQuantity: number;
  acceptedQuantity: number;
  quarantinedQuantity: number;
  rejectedQuantity: number;
  notes: string | null;
};

export class PrismaReceivingInspectionItemMapper {
  static toDomain(record: PrismaReceivingInspectionItemRecord): ReceivingInspectionItem {
    return ReceivingInspectionItem.fromSnapshot({
      purchaseItemId: record.purchaseItemId,
      variantId: record.variantId,
      expectedQuantity: record.expectedQuantity,
      acceptedQuantity: record.acceptedQuantity,
      quarantinedQuantity: record.quarantinedQuantity,
      rejectedQuantity: record.rejectedQuantity,
      notes: record.notes,
    });
  }
}