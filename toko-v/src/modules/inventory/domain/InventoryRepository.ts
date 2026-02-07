import { InventoryItem } from "./InventoryItem";
import { StockMovement } from "./StockMovement";

/**
 * Repository = kontrak penyimpanan state.
 * Bukan tempat naruh domain behavior.
 */
export interface InventoryRepository {
  find(productId: string): Promise<InventoryItem | null>;
  //save(item: InventoryItem): Promise<void>;
  increase(productId: string, quantity: number): Promise<void>;
  decrease(productId: string, quantity: number): Promise<void>;
  saveMovement(movement: StockMovement): Promise<void>;
}
