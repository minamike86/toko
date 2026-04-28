import type { ReactNode } from "react";

interface DashboardSectionProps {
  id: string;
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function DashboardSection({
  id,
  title,
  description,
  aside,
  children,
}: DashboardSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id={id} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>

        {aside ? <div>{aside}</div> : null}
      </div>

      {children}
    </section>
  );
}