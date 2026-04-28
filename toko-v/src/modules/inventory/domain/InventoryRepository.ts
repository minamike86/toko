import { InventoryItem } from "./InventoryItem";
import { StockMovement } from "./StockMovement";

export type StockMovementReadModel = {
  id: string;
  productId: string | null;
  variantId: string | null;
  type: string;
  origin: string;
  quantity: number;
  reason: string;
  referenceId: string | null;
  occurredAt: Date;
};

/**
 * Repository = kontrak penyimpanan state.
 * Bukan tempat naruh domain behavior.
 */
export interface InventoryRepository {
  findByVariantId(variantId: string): Promise<InventoryItem | null>;

  listMovementsByVariantId(
    variantId: string,
  ): Promise<ReadonlyArray<StockMovementReadModel>>;

  increaseByVariantId(variantId: string, quantity: number): Promise<void>;
  decreaseByVariantId(variantId: string, quantity: number): Promise<void>;

  saveMovement(movement: StockMovement): Promise<void>;
}