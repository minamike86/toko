export type PosCartItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  unit: string;
  price: number;
  quantity: number;
};

type PosCartProps = {
  items: PosCartItem[];
  onIncrease: (variantId: string) => void;
  onDecrease: (variantId: string) => void;
  onRemove: (variantId: string) => void;
};

export function PosCart({
  items,
  onIncrease,
  onDecrease,
  onRemove,
}: PosCartProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Belum ada item di cart.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3 font-medium">
        Cart
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.variantId} className="px-4 py-3">
            <div className="font-medium text-slate-900">
              {item.productName}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {item.variantName} · {item.unit} · {item.price}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDecrease(item.variantId)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  -
                </button>
                <span className="min-w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onIncrease(item.variantId)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  +
                </button>
              </div>

              <div className="text-sm font-medium text-slate-800">
                {item.price * item.quantity}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.variantId)}
              className="mt-3 text-sm text-red-600"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}