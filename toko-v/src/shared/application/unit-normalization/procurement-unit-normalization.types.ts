export type NormalizeProcurementItemInput = {
  variantId: string;
  transactionUnit: string;
  transactionQuantity: number;
  referenceId: string;
};

export type NormalizeProcurementItemResult = {
  variantId: string;
  transactionUnit: string;
  transactionQuantity: number;
  canonicalUnit: string;
  canonicalQuantity: number;
  referenceId: string;
};