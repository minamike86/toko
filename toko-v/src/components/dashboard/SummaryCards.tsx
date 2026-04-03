import { formatCurrency } from "../../shared/components/format";

export interface SummaryCardsProps {
  totalVariants: number;
  lowStockCount: number;
  cashInTotal: number;
  outstandingTotal: number;
}

interface SummaryCardItemProps {
  title: string;
  value: string;
  tone?: "default" | "warning" | "danger";
}

function SummaryCardItem({
  title,
  value,
  tone = "default",
}: SummaryCardItemProps) {
  const toneClassName =
    tone === "danger"
      ? "border-red-200 bg-red-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white";

  return (
    <div className={`rounded-lg border p-4 ${toneClassName}`}>
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function SummaryCards({
  totalVariants,
  lowStockCount,
  cashInTotal,
  outstandingTotal,
}: SummaryCardsProps) {
  return (
    <section aria-labelledby="dashboard-summary">
      <div className="mb-3">
        <h2 id="dashboard-summary" className="text-lg font-semibold text-slate-900">
          Ringkasan Operasional
        </h2>
        <p className="text-sm text-slate-600">
          Ringkasan dibaca langsung dari dashboard application layer.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCardItem
          title="Total Variant Aktif"
          value={String(totalVariants)}
        />
        <SummaryCardItem
          title="Low Stock"
          value={String(lowStockCount)}
          tone={lowStockCount > 0 ? "warning" : "default"}
        />
        <SummaryCardItem
          title="Kas Masuk"
          value={formatCurrency(cashInTotal)}
        />
        <SummaryCardItem
          title="Outstanding"
          value={formatCurrency(outstandingTotal)}
          tone={outstandingTotal > 0 ? "danger" : "default"}
        />
      </div>
    </section>
  );
}