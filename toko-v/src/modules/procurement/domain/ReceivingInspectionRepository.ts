import { ReceivingInspection } from "./ReceivingInspection";
import { TransactionContext } from "../application/ports/TransactionRunner";

export interface ReceivingInspectionRepository {
  findById(
    id: string,
    transaction?: TransactionContext,
  ): Promise<ReceivingInspection | null>;

  findByPurchaseOrderId(
    purchaseOrderId: string,
    transaction?: TransactionContext,
  ): Promise<ReceivingInspection | null>;

  save(
    inspection: ReceivingInspection,
    transaction?: TransactionContext,
  ): Promise<void>;
}