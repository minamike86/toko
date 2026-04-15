import { NextResponse } from "next/server";

import { getInventorySnapshotReport } from "@/modules/reporting/application/get-inventory-snapshot-report";
import { getInventoryLowStockReport } from "@/modules/reporting/application/get-inventory-low-stock-report";

const LOW_STOCK_THRESHOLD = 10;

export type InventoryListRow = {
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  variantName: string;
  unit: string;
  quantity: number;
  isLowStock: boolean;
};

export async function GET() {
  const [snapshotRows, lowStockRows] = await Promise.all([
    getInventorySnapshotReport(),
    getInventoryLowStockReport(LOW_STOCK_THRESHOLD),
  ]);

  const lowStockVariantIds = new Set(
    lowStockRows.map((row) => row.variantId),
  );

  const rows: InventoryListRow[] = snapshotRows.map((row) => ({
    variantId: row.variantId,
    productId: row.productId,
    sku: row.sku,
    productName: row.productName,
    variantName: row.variantName,
    unit: row.unit,
    quantity: row.currentStockQuantity,
    isLowStock: lowStockVariantIds.has(row.variantId),
  }));

  return NextResponse.json(rows, { status: 200 });
}