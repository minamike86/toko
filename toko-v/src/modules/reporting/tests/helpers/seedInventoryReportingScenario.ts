// seedInventoryReportingScenario.ts
import prisma from "@/shared/prisma";
import { randomUUID } from "crypto";


/**
 * Seed inventory data khusus untuk reporting integration test.
 *
 * - Reporting-only
 * - Idempotent
 * - Tidak asumsi DB kosong
 * - Aman untuk schema-per-suite
 */

type InventoryItemSeed = {
  productId: string;
  quantity: number;
};

type StockMovementSeed = {
  id: string;
  productId: string;
  occurredAt: Date;
  type: "IN" | "OUT" | "ADJUST";
  origin: "LEGACY" | "MANUAL_ADJUSTMENT" | "PURCHASE";
  quantity: number;
  reason?: string;
  referenceId?: string;
};

type SeedInventoryReportingScenarioInput = {
  inventoryItems: InventoryItemSeed[];
  stockMovements?: StockMovementSeed[];
};

export async function seedInventoryReportingScenario(
  db: typeof prisma,
  input: SeedInventoryReportingScenarioInput
): Promise<void> {
  for (const item of input.inventoryItems) {
    await db.inventoryItem.upsert({
      where: { productId: item.productId },
      update: { quantity: item.quantity },
      create: {
        productId: item.productId,
        quantity: item.quantity,
      },
    });
  }

  if (input.stockMovements?.length) {
    for (const m of input.stockMovements) {
      await db.stockMovement.create({
        data: {
          id: m.id ?? randomUUID(), // WAJIB selalu string
          productId: m.productId,
          occurredAt: m.occurredAt,
          type: m.type,
          origin: m.origin,
          quantity: m.quantity,
          reason: m.reason ?? "seed",
          referenceId: m.referenceId ?? null,
        },
      });

    }
  }
}
