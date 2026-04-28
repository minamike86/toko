export type Step7ActorRole = "ADMIN" | "WAREHOUSE" | "SALES";

export type ActorContext = {
  actorId: string;
  role: Step7ActorRole;
};

export type RecordSupplierPaymentInput = {
  purchaseOrderId: string;
  amount: number;
  paidAt: Date;
  notes: string | null;
  actor: ActorContext;
};

export type RecordSupplierPaymentResult = {
  purchaseOrderId: string;
  supplierId: string;
  paidAmount: number;
  payableInitial: number;
  totalPaid: number;
  totalReturned: number;
  outstanding: number;
  paymentId: string;
  paidAt: Date;
};

export type GetSupplierOutstandingInput = {
  supplierId: string;
  actor: ActorContext;
};

export type SupplierOutstandingPurchaseOrderDTO = {
  purchaseOrderId: string;
  receivedAt: Date;
  payableInitial: number;
  totalPaid: number;
  totalReturned: number;
  outstanding: number;
};

export type GetSupplierOutstandingResult = {
  supplierId: string;
  supplierStoreName: string;
  totalOutstanding: number;
  purchaseOrders: SupplierOutstandingPurchaseOrderDTO[];
};

export type HandlePurchaseReturnInput = {
  purchaseOrderId: string;
  returnItems: Array<{
    purchaseItemId: string;
    quantity: number;
    reason: string | null;
  }>;
  returnedAt: Date;
  notes: string | null;
  actor: ActorContext;
};

export type HandlePurchaseReturnResult = {
  purchaseOrderId: string;
  supplierId: string;
  returnId: string;
  reducedAmount: number;
  payableInitial: number;
  totalPaid: number;
  totalReturned: number;
  outstanding: number;
  returnedAt: Date;
};

export type Step7UseCaseContext = {
  now: () => Date;
};