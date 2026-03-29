import { PrismaClient } from "@prisma/client";
import {
  InventoryRepository,
  StockMovementReadModel,
} from "../domain/InventoryRepository";
import { InventoryItem } from "../domain/InventoryItem";
import { StockMovement } from "../domain/StockMovement";

export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findByVariantId(variantId: string): Promise<InventoryItem | null> {
    const record = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
    });

    if (!record) {
      return null;
    }

    return InventoryItem.of(record.quantity);
  }

  async listMovementsByVariantId(
    variantId: string,
  ): Promise<ReadonlyArray<StockMovementReadModel>> {
    const records = await this.prisma.stockMovement.findMany({
      where: { variantId },
      orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
    });

    return records.map((record) => this.toStockMovementReadModel(record));
  }

  async increaseByVariantId(variantId: string, quantity: number): Promise<void> {
    const record = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
    });

    if (!record) {
      throw new Error(`Inventory item ${variantId} tidak ditemukan`);
    }

    await this.prisma.inventoryItem.update({
      where: { variantId },
      data: { quantity: record.quantity + quantity },
    });
  }

  async decreaseByVariantId(variantId: string, quantity: number): Promise<void> {
    const record = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
    });

    if (!record || record.quantity < quantity) {
      throw new Error("Stok tidak mencukupi");
    }

    await this.prisma.inventoryItem.update({
      where: { variantId },
      data: { quantity: record.quantity - quantity },
    });
  }

  async saveMovement(movement: StockMovement): Promise<void> {
    let productId = movement.productId ?? null;

    if (!productId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: movement.variantId },
        select: { productId: true },
      });

      if (!variant) {
        throw new Error(
          `ProductVariant tidak ditemukan saat menyimpan movement: ${movement.variantId}`,
        );
      }

      productId = variant.productId;
    }

    await this.prisma.stockMovement.create({
      data: {
        id: movement.id,
        productId,
        variantId: movement.variantId,
        type: movement.type,
        origin: movement.origin,
        quantity: movement.quantity,
        reason: movement.reason,
        referenceId: movement.referenceId,
        occurredAt: movement.occurredAt,
      },
    });
  }

  private toStockMovementReadModel(record: {
    id: string;
    productId: string | null;
    variantId: string | null;
    type: string;
    origin: string;
    quantity: number;
    reason: string;
    referenceId: string | null;
    occurredAt: Date;
  }): StockMovementReadModel {
    return {
      id: record.id,
      productId: record.productId,
      variantId: record.variantId,
      type: record.type,
      origin: record.origin,
      quantity: record.quantity,
      reason: record.reason,
      referenceId: record.referenceId,
      occurredAt: record.occurredAt,
    };
  }
}