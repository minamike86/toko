export type SupplierDto = {
  id: string;
  storeName: string;
  salesName: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
};