export type ProcurementNormalizationErrorCode =
  | "INVALID_INPUT_UNIT"
  | "CONVERSION_RULE_NOT_FOUND"
  | "NORMALIZED_QUANTITY_INVALID"
  | "NON_CANONICAL_QUANTITY";

export class ProcurementNormalizationError extends Error {
  readonly code: ProcurementNormalizationErrorCode;

  constructor(code: ProcurementNormalizationErrorCode, message: string) {
    super(message);
    this.name = "ProcurementNormalizationError";
    this.code = code;
  }
}