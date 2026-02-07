// modules/inventory/infrastructure/PrismaInventoryRepository.ts
import { PrismaClient } from "@prisma/client";
import { StockMovement} from '../domain/StockMovement';
import { InventoryRepository } from '../domain/InventoryRepository';
import { InventoryItem } from '../domain/InventoryItem';



export class PrismaInventoryRepository implements InventoryRepository {
  constructor(
    private readonly prisma: PrismaClient
  ) {}

  async find(productId: string): Promise<InventoryItem | null> {
    const record = await this.prisma.inventoryItem.findUnique({
      where: { productId },
    });

    if (!record) {
      return null;
    }

    return InventoryItem.of(record.productId, record.quantity);
  }

  async increase(productId: string, quantity: number): Promise<void> {
    const record = await this.prisma.inventoryItem.findUnique({
      where: { productId },
    });

    if (!record) {
      await this.prisma.inventoryItem.create({
        data: { productId, quantity },
      });
      return;
    }

    await this.prisma.inventoryItem.update({
      where: { productId },
      data: { quantity: record.quantity + quantity },
    });
  }

  async decrease(productId: string, quantity: number): Promise<void> {
    const record = await this.prisma.inventoryItem.findUnique({
      where: { productId },
    });

    if (!record || record.quantity < quantity) {
      throw new Error("Stok tidak mencukupi");
    }

    await this.prisma.inventoryItem.update({
      where: { productId },
      data: { quantity: record.quantity - quantity },
    });
  }

  async saveMovement(movement: StockMovement): Promise<void> {
    await this.prisma.stockMovement.create({
      data: {
        id: movement.id.toString(),
        productId: movement.productId,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        referenceId: movement.referenceId,
        occurredAt: movement.occurredAt,
      },
    });
  }
}