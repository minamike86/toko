export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateRange(from: Date, to: Date): string {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  });

  return `${formatter.format(new Date(from))} - ${formatter.format(new Date(to))}`;
}