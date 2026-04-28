"use client";

import { useEffect, useState } from "react";

import {
  InventoryTable,
  type InventoryTableRow,
} from "./_components/InventoryTable";

type WarehouseDashboardResponse = {
  asOf: string;
  totalVariants: number;
  lowStockCount: number;
  items: InventoryTableRow[];
};

export default function InventoryPage() {
  const [rows, setRows] = useState<InventoryTableRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInventory(): Promise<void> {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await fetch("/api/dashboard/warehouse", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load inventory");
        }

        const data =
          (await response.json()) as WarehouseDashboardResponse;

        if (!isMounted) {
          return;
        }

        setRows(data.items);
      } catch (_error: unknown) {
        if (!isMounted) {
          return;
        }

        setErrorMessage("Gagal memuat data inventory.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Daftar inventory saat ini. Halaman ini bersifat read-only.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Memuat data inventory...
        </div>
      ) : errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : (
        <InventoryTable rows={rows} />
      )}
    </main>
  );
}