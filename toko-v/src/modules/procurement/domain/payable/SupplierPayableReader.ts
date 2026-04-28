import { SupplierId } from "./SupplierPayable";

export type SupplierPayableSnapshot = {
  id: SupplierId;
  storeName: string;
  isActive: boolean;
};

export interface SupplierPayableReader {
  findPayableSnapshotById(
    supplierId: SupplierId,
  ): Promise<SupplierPayableSnapshot | null>;
}