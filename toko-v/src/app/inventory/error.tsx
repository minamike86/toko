"use client";

type InventoryErrorProps = {
  error: Error;
  reset: () => void;
};

export default function InventoryError({
  error,
  reset,
}: InventoryErrorProps) {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-800">
          Gagal membuka halaman inventory
        </h2>
        <p className="mt-2 text-sm text-red-700">
          {error.message || "Terjadi kesalahan yang tidak diketahui."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700"
        >
          Coba lagi
        </button>
      </div>
    </main>
  );
}