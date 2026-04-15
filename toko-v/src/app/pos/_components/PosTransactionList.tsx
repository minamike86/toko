export type PosTransactionRow = {
  id: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  outstandingAmount: number;
  type: string;
};

type PosTransactionListProps = {
  rows: PosTransactionRow[];
  onCancel: (orderId: string) => void;
  onPayCredit: (orderId: string) => void;
  isActing: boolean;
};

function canCancel(status: string): boolean {
  return ["CREATED", "PAID", "ON_CREDIT"].includes(status);
}

function canPayCredit(status: string): boolean {
  return status === "ON_CREDIT";
}

export function PosTransactionList({
  rows,
  onCancel,
  onPayCredit,
  isActing,
}: PosTransactionListProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Belum ada transaksi.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3 font-medium">
        Transaksi Terakhir
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-700">Order ID</th>
              <th className="px-4 py-3 font-medium text-slate-700">Status</th>
              <th className="px-4 py-3 font-medium text-slate-700">Total</th>
              <th className="px-4 py-3 font-medium text-slate-700">Outstanding</th>
              <th className="px-4 py-3 font-medium text-slate-700">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.id}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">{row.totalAmount}</td>
                <td className="px-4 py-3">{row.outstandingAmount}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {canCancel(row.status) ? (
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => onCancel(row.id)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        Cancel
                      </button>
                    ) : null}

                    {canPayCredit(row.status) ? (
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => onPayCredit(row.id)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        Pay Credit
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}