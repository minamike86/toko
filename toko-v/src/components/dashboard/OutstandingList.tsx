import type { CashClarityDTO } from "@/modules/dashboard/dto/cash-clarity.dto";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { DashboardSection } from "./DashboardSection";
import { formatCurrency, formatDateTime } from "../../shared/components/format";

export interface OutstandingListProps {
  outstandingTotal: CashClarityDTO["outstandingTotal"];
  outstandingOrders: CashClarityDTO["outstandingOrders"];
}

export function OutstandingList({
  outstandingTotal,
  outstandingOrders,
}: OutstandingListProps) {
  return (
    <DashboardSection
      id="outstanding-section"
      title="Outstanding"
      description="Outstanding harus terlihat langsung."
      aside={
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm">
          <span className="text-slate-500">Total Outstanding:</span>{" "}
          <span className="font-semibold text-red-700">
            {formatCurrency(outstandingTotal)}
          </span>
        </div>
      }
    >
      {outstandingOrders.length === 0 ? (
        <DashboardEmptyState message="Tidak ada order outstanding saat ini." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">Dibuat</th>
                <th className="px-3 py-2">Total Order</th>
                <th className="px-3 py-2">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {outstandingOrders.map((order) => (
                <tr key={order.orderId} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">
                    {order.orderId}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-slate-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-3 py-2 font-medium text-red-700">
                    {formatCurrency(order.outstandingAmount)}
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