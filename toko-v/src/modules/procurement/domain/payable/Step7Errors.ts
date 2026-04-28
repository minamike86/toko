export type Step7BusinessErrorCode =
  | "PURCHASE_ORDER_NOT_FOUND"
  | "PURCHASE_ORDER_NOT_RECEIVED"
  | "SUPPLIER_NOT_FOUND"
  | "INVALID_SUPPLIER_PAYMENT_AMOUNT"
  | "SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING"
  | "PURCHASE_RETURN_ITEM_INVALID"
  | "PURCHASE_RETURN_EXCEEDS_ALLOWED_REDUCTION"
  | "PURCHASE_RETURN_REDUCTION_EXCEEDS_OUTSTANDING"
  | "SUPPLIER_OUTSTANDING_NEGATIVE"
  | "FORBIDDEN";

export type Step7RepositoryErrorCode =
  | "SUPPLIER_PAYMENT_ALREADY_EXISTS"
  | "SUPPLIER_PAYMENT_PERSISTENCE_FAILED"
  | "PURCHASE_RETURN_ALREADY_EXISTS"
  | "PURCHASE_RETURN_PERSISTENCE_FAILED"
  | "SUPPLIER_PAYABLE_QUERY_FAILED";

export type Step7ErrorCode =
  | Step7BusinessErrorCode
  | Step7RepositoryErrorCode;

export class Step7BusinessError extends Error {
  readonly code: Step7BusinessErrorCode;

  constructor(code: Step7BusinessErrorCode, message: string) {
    super(message);
    this.name = "Step7BusinessError";
    this.code = code;
  }
}

export class Step7RepositoryError extends Error {
  readonly code: Step7RepositoryErrorCode;

  constructor(code: Step7RepositoryErrorCode, message: string) {
    super(message);
    this.name = "Step7RepositoryError";
    this.code = code;
  }
}