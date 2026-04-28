import type {
  NormalizeProcurementItemInput,
  NormalizeProcurementItemResult,
} from "@/shared/application/unit-normalization/procurement-unit-normalization.types";

export interface ProcurementUnitNormalizationPort {
  normalizeProcurementItem(
    input: NormalizeProcurementItemInput,
  ): Promise<NormalizeProcurementItemResult>;
}