export type PosVariantOption = {
  variantId: string;
  productId: string;
  productName: string;
  variantName?: string;
  unit: string;
  price: number;
  isActive: boolean;
};

type PosCatalogListProps = {
  isLoading: boolean;
  variants: PosVariantOption[];
  onAdd: (variant: PosVariantOption) => void;
};

export function PosCatalogList({
  isLoading,
  variants,
  onAdd,
}: PosCatalogListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Memuat daftar variant...
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Belum ada variant yang tersedia.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3 font-medium">
        Daftar Variant
      </div>

      <div className="divide-y divide-slate-100">
        {variants.map((variant) => (
          <div
            key={variant.variantId}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div>
              <div className="font-medium text-slate-900">
                {variant.productName}
              </div>
              <div className="text-sm text-slate-600">
                {variant.variantName ?? "-"} · {variant.unit} · {variant.price}
              </div>
            </div>

            <button
              type="button"
              disabled={!variant.isActive}
              onClick={() => onAdd(variant)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tambah
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}