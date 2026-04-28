import { Supplier } from "./Supplier";

export interface SupplierRepository {
  nextId(): string;
  save(supplier: Supplier): Promise<void>;
  findById(id: string): Promise<Supplier | null>;
  findByStoreName(storeName: string): Promise<Supplier | null>;
}