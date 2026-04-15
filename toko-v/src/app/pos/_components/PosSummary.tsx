type PosSummaryProps = {
  payment: "CASH" | "CREDIT";
  totalItems: number;
  estimatedTotal: number;
  onChangePayment: (payment: "CASH" | "CREDIT") => void;
};

export function PosSummary({
  payment,
  totalItems,
  estimatedTotal,
  onChangePayment,
}: PosSummaryProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 font-medium">Ringkasan</div>

      <div className="mb-3 text-sm text-slate-700">
        <div>Total Item: {totalItems}</div>
        <div>Estimasi Total: {estimatedTotal}</div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={payment === "CASH"}
            onChange={() => onChangePayment("CASH")}
          />
          CASH
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={payment === "CREDIT"}
            onChange={() => onChangePayment("CREDIT")}
          />
          CREDIT
        </label>
      </div>
    </div>
  );
}