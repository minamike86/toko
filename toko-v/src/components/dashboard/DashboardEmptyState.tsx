interface DashboardEmptyStateProps {
  message: string;
}

export function DashboardEmptyState({
  message,
}: DashboardEmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-600">
      {message}
    </div>
  );
}