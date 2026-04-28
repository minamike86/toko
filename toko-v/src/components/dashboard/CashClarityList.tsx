import type { CashClarityDTO } from "@/modules/dashboard/dto/cash-clarity.dto";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { DashboardSection } from "./DashboardSection";
import {
  formatCurrency,
  formatDateRange,
  formatDateTime,
} from "../../shared/components/format";

export interface CashClarityListProps {
  period: CashClarityDTO["period"];
  cashInTotal: CashClarityDTO["cashInTotal"];
  paymentEvents: CashClarityDTO["paymentEvents"];
}

export function CashClarityList({
  period,
  cashInTotal,
  paymentEvents,
}: CashClarityListProps) {
  return (
    <DashboardSection
      id="cash-clarity-section"
      title="Cash Clarity"
      description={`Periode: ${formatDateRange(period.from, period.to)}`}
      aside={
        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">Kas Masuk:</span>{" "}
          <span className="font-semibold text-slate-900">
            {formatCurrency(cashInTotal)}
          </span>
        </div>
      }
    >
      {paymentEvents.length === 0 ? (
        <DashboardEmptyState message="Belum ada payment event pada periode ini." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">Payment ID</th>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paymentEvents.map((event) => (
                <tr key={event.paymentId} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-700">
                    {formatDateTime(event.paymentDate)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">
                    {event.paymentId}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">
                    {event.orderId}
                  </td>
                  <td className="px-3 py-2 text-slate-900">{event.method}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {formatCurrency(event.amount)}
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