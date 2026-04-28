export type InventoryTableRow = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  unit: string;
  currentStockQuantity: number;
  isLowStock: boolean;
};

type InventoryTableProps = {
  rows: InventoryTableRow[];
};

export function InventoryTable({ rows }: InventoryTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Belum ada data inventory.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium text-slate-700">SKU</th>
            <th className="px-4 py-3 font-medium text-slate-700">Produk</th>
            <th className="px-4 py-3 font-medium text-slate-700">Varian</th>
            <th className="px-4 py-3 font-medium text-slate-700">Unit</th>
            <th className="px-4 py-3 font-medium text-slate-700">Stok</th>
            <th className="px-4 py-3 font-medium text-slate-700">Status</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.variantId} className="border-t border-slate-100">
              <td className="px-4 py-3">{row.sku}</td>
              <td className="px-4 py-3">{row.productName}</td>
              <td className="px-4 py-3">{row.variantName}</td>
              <td className="px-4 py-3">{row.unit}</td>
              <td className="px-4 py-3 font-medium">
                {row.currentStockQuantity}
              </td>
              <td className="px-4 py-3">
                {row.isLowStock ? (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                    Low Stock
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                    Normal
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}