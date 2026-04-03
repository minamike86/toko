"use client";

interface HomeErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function HomeErrorPage({
  error,
  reset,
}: HomeErrorPageProps) {
  return (
    <main className="p-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <h1 className="text-lg font-semibold text-red-700">
          Gagal memuat dashboard
        </h1>

        <p className="mt-2 text-sm text-red-600">
          Terjadi error saat mengambil data dashboard dari application layer.
        </p>

        <div className="mt-4 rounded-md bg-white/70 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-red-500">
            Detail
          </p>
          <p className="mt-1 break-words text-sm text-slate-700">
            {error.message || "Unknown error"}
          </p>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Coba lagi
          </button>
        </div>
      </div>
    </main>
  );
}