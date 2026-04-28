interface ShellHeaderProps {
  pageTitle: string;
  hasSidebar: boolean;
}

export function ShellHeader({ pageTitle, hasSidebar }: ShellHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6 ${hasSidebar ? "" : "pl-20 md:pl-24"
        }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Operasional
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {pageTitle}
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          Presentational shell
        </div>
      </div>
    </header>
  );
}