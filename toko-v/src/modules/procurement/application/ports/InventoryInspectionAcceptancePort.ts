import { TransactionContext } from "./TransactionRunner";

export type ReceiveAcceptedInspectionItemInput = {
  variantId: string;
  quantity: number;
  purchaseOrderId: string;
};

export type ReceiveAcceptedInspectionInput = {
  purchaseOrderId: string;
  items: ReceiveAcceptedInspectionItemInput[];
};

export interface InventoryInspectionAcceptancePort {
  receiveAcceptedItems(
    input: ReceiveAcceptedInspectionInput,
    transaction: TransactionContext,
  ): Promise<void>;
}