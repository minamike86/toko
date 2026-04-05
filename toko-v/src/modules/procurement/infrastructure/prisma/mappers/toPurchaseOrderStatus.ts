import {
  isPurchaseOrderStatus,
  PurchaseOrderStatus,
} from "@/modules/procurement/domain/PurchaseOrderStatus";
import { PurchaseOrderStatusInvalidError } from "@/modules/procurement/domain/ProcurementErrors";

export function toPurchaseOrderStatus(value: string): PurchaseOrderStatus {
  if (!isPurchaseOrderStatus(value)) {
    throw new PurchaseOrderStatusInvalidError();
  }

  return value;
}