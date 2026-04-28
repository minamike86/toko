import { PurchaseOrder } from "./PurchaseOrder";

export interface PurchaseOrderRepository {
  nextId(): string;
  nextItemId(): string;
  save(order: PurchaseOrder): Promise<void>;
  findById(id: string): Promise<PurchaseOrder | null>;
}