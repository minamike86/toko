import { DomainError } from "@/shared/errors/DomainError";

export class InsufficientStockError extends DomainError {
  constructor(variantId: string) {
    super(`Stok tidak mencukupi untuk variant ${variantId}.`);
  }
}