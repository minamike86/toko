import type { WarehouseDashboardDTO } from "@/modules/dashboard/dto/warehouse-dashboard.dto";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { DashboardSection } from "./DashboardSection";
import { formatNumber } from "../../shared/components/format";

export interface LowStockListProps {
  items: WarehouseDashboardDTO["items"];
}

export function LowStockList({ items }: LowStockListProps) {
  const lowStockItems = items.filter((item) => item.isLowStock);

  return (
    <DashboardSection
      id="low-stock-section"
      title="Low Stock"
      description="Variant kritis harus terlihat langsung tanpa interaksi tambahan."
    >
      {lowStockItems.length === 0 ? (
        <DashboardEmptyState message="Tidak ada variant low stock saat ini." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Produk</th>
                <th className="px-3 py-2">Variant</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Stok Saat Ini</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item) => (
                <tr key={item.variantId} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">
                    {item.sku}
                  </td>
                  <td className="px-3 py-2 text-slate-900">{item.productName}</td>
                  <td className="px-3 py-2 text-slate-700">{item.variantName}</td>
                  <td className="px-3 py-2 text-slate-700">{item.unit}</td>
                  <td className="px-3 py-2 font-medium text-red-700">
                    {formatNumber(item.currentStockQuantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardSection>
  );
}