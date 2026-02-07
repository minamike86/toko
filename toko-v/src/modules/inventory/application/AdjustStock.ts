import { InventoryRepository } from "../domain/InventoryRepository";
import { StockMovement } from "../domain/StockMovement";

export type AdjustStockInput = {
  productId: string;
  newQuantity: number;
  reason: string;
};

type Deps = {
  inventoryRepo: InventoryRepository;
};

export class AdjustStock {
  constructor(private readonly deps: Deps) {}

  async execute(input: AdjustStockInput): Promise<void> {
    const item = await this.deps.inventoryRepo.find(input.productId);

    if (!item) {
      throw new Error(`Inventory tidak ditemukan: ${input.productId}`);
    }

    if (input.newQuantity === 0) {
      // koreksi nol tidak bermakna, tapi ini keputusan eksplisit
      return;
    }

    const movement = StockMovement.adjust(
      input.productId,
      Math.abs(input.newQuantity),
      input.reason
    );

    if (input.newQuantity > 0) {
      await this.deps.inventoryRepo.increase(
        input.productId,
        input.newQuantity
      );
    } else {
      await this.deps.inventoryRepo.decrease(
        input.productId,
        Math.abs(input.newQuantity)
      );
    }

    await this.deps.inventoryRepo.saveMovement(movement);
  }
}
