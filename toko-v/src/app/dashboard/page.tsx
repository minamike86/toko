"use client";

import { useEffect, useMemo, useState } from "react";

interface LowStockItem {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  unit: string;
  currentStockQuantity: number;
  isLowStock: boolean;
}

interface PaymentEventItem {
  paymentId: string;
  paymentDate: string;
  amount: number;
  method: string;
  orderId: string;
}

interface OutstandingOrderItem {
  orderId: string;
  createdAt: string;
  totalAmount: number;
  outstandingAmount: number;
}

interface WarehouseDashboardDto {
  totalVariants: number;
  lowStockCount: number;
  lowStockItems: LowStockItem[];
}

interface CashClarityDashboardDto {
  cashInTotal: number;
  outstandingTotal: number;
  paymentEvents: PaymentEventItem[];
  outstandingOrders: OutstandingOrderItem[];
}

type LoadStatus = "idle" | "loading" | "success" | "error";

interface SectionState<TData> {
  status: LoadStatus;
  data: TData | null;
  errorMessage: string | null;
}

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toLowStockItem(value: unknown): LowStockItem {
  const record = isJsonObject(value) ? value : {};

  return {
    variantId: readString(record.variantId),
    sku: readString(record.sku),
    productName: readString(record.productName),
    variantName: readString(record.variantName),
    unit: readString(record.unit),
    currentStockQuantity: readNumber(record.currentStockQuantity),
    isLowStock: readBoolean(record.isLowStock),
  };
}

function toPaymentEventItem(value: unknown): PaymentEventItem {
  const record = isJsonObject(value) ? value : {};

  return {
    paymentId: readString(record.paymentId),
    paymentDate: readString(record.paymentDate),
    amount: readNumber(record.amount),
    method: readString(record.method),
    orderId: readString(record.orderId),
  };
}

function toOutstandingOrderItem(value: unknown): OutstandingOrderItem {
  const record = isJsonObject(value) ? value : {};

  return {
    orderId: readString(record.orderId),
    createdAt: readString(record.createdAt),
    totalAmount: readNumber(record.totalAmount),
    outstandingAmount: readNumber(record.outstandingAmount),
  };
}

function toWarehouseDashboardDto(value: unknown): WarehouseDashboardDto {
  const record = isJsonObject(value) ? value : {};
  const summary = isJsonObject(record.summary) ? record.summary : record;

  return {
    totalVariants: readNumber(summary.totalVariants),
    lowStockCount: readNumber(summary.lowStockCount),
    lowStockItems: readArray(record.lowStockItems).map(toLowStockItem),
  };
}

function toCashClarityDashboardDto(value: unknown): CashClarityDashboardDto {
  const record = isJsonObject(value) ? value : {};
  const summary = isJsonObject(record.summary) ? record.summary : record;

  return {
    cashInTotal: readNumber(summary.cashInTotal),
    outstandingTotal: readNumber(summary.outstandingTotal),
    paymentEvents: readArray(record.paymentEvents).map(toPaymentEventItem),
    outstandingOrders: readArray(record.outstandingOrders).map(
      toOutstandingOrderItem,
    ),
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(parsedDate);
}

function SectionCard(props: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{props.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{props.description}</p>
      </div>
      {props.children}
    </section>
  );
}

function StateMessage(props: {
  tone: "default" | "error";
  children: React.ReactNode;
}) {
  const className =
    props.tone === "error"
      ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      : "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600";

  return <div className={className}>{props.children}</div>;
}

export default function DashboardPage() {
  const [warehouseState, setWarehouseState] = useState<
    SectionState<WarehouseDashboardDto>
  >({
    status: "loading",
    data: null,
    errorMessage: null,
  });

  const [cashState, setCashState] = useState<
    SectionState<CashClarityDashboardDto>
  >({
    status: "loading",
    data: null,
    errorMessage: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard(): Promise<void> {
      setWarehouseState({
        status: "loading",
        data: null,
        errorMessage: null,
      });
      setCashState({
        status: "loading",
        data: null,
        errorMessage: null,
      });

      const warehousePromise = fetch("/api/dashboard/warehouse", {
        cache: "no-store",
      });

      const cashPromise = fetch("/api/dashboard?page=1&limit=10", {
        cache: "no-store",
      });

      const [warehouseResponse, cashResponse] = await Promise.allSettled([
        warehousePromise,
        cashPromise,
      ]);

      if (cancelled) {
        return;
      }

      if (
        warehouseResponse.status === "fulfilled" &&
        warehouseResponse.value.ok
      ) {
        const warehouseJson = await warehouseResponse.value.json();
        setWarehouseState({
          status: "success",
          data: toWarehouseDashboardDto(warehouseJson),
          errorMessage: null,
        });
      } else {
        setWarehouseState({
          status: "error",
          data: null,
          errorMessage: "Gagal memuat low stock dan summary warehouse.",
        });
      }

      if (cashResponse.status === "fulfilled" && cashResponse.value.ok) {
        const cashJson = await cashResponse.value.json();
        setCashState({
          status: "success",
          data: toCashClarityDashboardDto(cashJson),
          errorMessage: null,
        });
      } else {
        setCashState({
          status: "error",
          data: null,
          errorMessage: "Gagal memuat cash clarity dan outstanding.",
        });
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const summaryCards = useMemo(() => {
    const totalVariants = warehouseState.data?.totalVariants ?? 0;
    const lowStockCount = warehouseState.data?.lowStockCount ?? 0;
    const cashInTotal = cashState.data?.cashInTotal ?? 0;
    const outstandingTotal = cashState.data?.outstandingTotal ?? 0;

    return [
      {
        label: "Total Variants",
        value: totalVariants.toLocaleString("id-ID"),
      },
      {
        label: "Low Stock",
        value: lowStockCount.toLocaleString("id-ID"),
      },
      {
        label: "Cash In Total",
        value: formatCurrency(cashInTotal),
      },
      {
        label: "Outstanding Total",
        value: formatCurrency(outstandingTotal),
      },
    ];
  }, [cashState.data, warehouseState.data]);

  const summaryIsLoading =
    warehouseState.status === "loading" || cashState.status === "loading";
  const summaryHasError =
    warehouseState.status === "error" || cashState.status === "error";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Visibilitas operasional harian tanpa menambah rule bisnis baru.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryIsLoading ? (
          <StateMessage tone="default">Memuat summary dashboard...</StateMessage>
        ) : null}

        {!summaryIsLoading && summaryHasError ? (
          <StateMessage tone="error">
            Summary dashboard tidak dapat ditampilkan penuh karena salah satu
            sumber gagal dimuat.
          </StateMessage>
        ) : null}

        {!summaryIsLoading && !summaryHasError
          ? summaryCards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {card.value}
              </p>
            </article>
          ))
          : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Low Stock"
          description="Harus langsung terlihat sesuai batas Step 5.5."
        >
          {warehouseState.status === "loading" ? (
            <StateMessage tone="default">Memuat low stock...</StateMessage>
          ) : null}

          {warehouseState.status === "error" ? (
            <StateMessage tone="error">
              {warehouseState.errorMessage}
            </StateMessage>
          ) : null}

          {warehouseState.status === "success" &&
            warehouseState.data?.lowStockItems.length === 0 ? (
            <StateMessage tone="default">
              Tidak ada item low stock.
            </StateMessage>
          ) : null}

          {warehouseState.status === "success" &&
            warehouseState.data?.lowStockItems.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-2 py-2 font-medium">SKU</th>
                    <th className="px-2 py-2 font-medium">Produk</th>
                    <th className="px-2 py-2 font-medium">Varian</th>
                    <th className="px-2 py-2 font-medium">Unit</th>
                    <th className="px-2 py-2 font-medium">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseState.data.lowStockItems.map((item) => (
                    <tr
                      key={item.variantId}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-2 py-3">{item.sku}</td>
                      <td className="px-2 py-3">{item.productName}</td>
                      <td className="px-2 py-3">{item.variantName}</td>
                      <td className="px-2 py-3">{item.unit}</td>
                      <td className="px-2 py-3 font-semibold text-slate-900">
                        {item.currentStockQuantity.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Outstanding"
          description="Daftar piutang berjalan dari contract dashboard resmi."
        >
          {cashState.status === "loading" ? (
            <StateMessage tone="default">Memuat outstanding...</StateMessage>
          ) : null}

          {cashState.status === "error" ? (
            <StateMessage tone="error">{cashState.errorMessage}</StateMessage>
          ) : null}

          {cashState.status === "success" &&
            cashState.data?.outstandingOrders.length === 0 ? (
            <StateMessage tone="default">
              Tidak ada order outstanding.
            </StateMessage>
          ) : null}

          {cashState.status === "success" &&
            cashState.data?.outstandingOrders.length ? (
            <div className="space-y-3">
              {cashState.data.outstandingOrders.map((order) => (
                <article
                  key={order.orderId}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Order {order.orderId}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      <p>Total: {formatCurrency(order.totalAmount)}</p>
                      <p className="font-semibold text-slate-900">
                        Outstanding: {formatCurrency(order.outstandingAmount)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard
        title="Cash Clarity"
        description="Menampilkan payment events terbatas agar tidak memuat data tanpa batas."
      >
        {cashState.status === "loading" ? (
          <StateMessage tone="default">Memuat cash clarity...</StateMessage>
        ) : null}

        {cashState.status === "error" ? (
          <StateMessage tone="error">{cashState.errorMessage}</StateMessage>
        ) : null}

        {cashState.status === "success" &&
          cashState.data?.paymentEvents.length === 0 ? (
          <StateMessage tone="default">
            Belum ada payment event pada halaman ini.
          </StateMessage>
        ) : null}

        {cashState.status === "success" &&
          cashState.data?.paymentEvents.length ? (
          <div className="space-y-3">
            {cashState.data.paymentEvents.map((payment) => (
              <article
                key={payment.paymentId}
                className="rounded-xl border border-slate-200 px-4 py-3"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Order {payment.orderId}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(payment.paymentDate)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-600">{payment.method}</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}