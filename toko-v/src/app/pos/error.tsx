"use client";

type PosErrorProps = {
  error: Error;
  reset: () => void;
};

export default function PosError({ error, reset }: PosErrorProps) {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h2 className="text-lg font-semibold text-red-800">
          Gagal membuka halaman POS
        </h2>
        <p className="mt-2 text-sm text-red-700">
          {error.message || "Terjadi kesalahan."}
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