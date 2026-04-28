export default function HomeLoading() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-2">
        <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded bg-slate-100"
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded bg-slate-100"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="h-6 w-36 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-10 animate-pulse rounded bg-slate-100"
            />
          ))}
        </div>
      </section>
    </main>
  );
}