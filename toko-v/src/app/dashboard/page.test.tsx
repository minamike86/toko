import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";

const fetchMock = vi.fn();

describe("DashboardPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("renders loading state before dashboard data is resolved", () => {
    fetchMock.mockImplementation(
      () =>
        new Promise(() => {
          return undefined;
        }),
    );

    render(<DashboardPage />);

    expect(screen.getByText("Memuat summary dashboard...")).toBeInTheDocument();
    expect(screen.getByText("Memuat low stock...")).toBeInTheDocument();
    expect(screen.getByText("Memuat outstanding...")).toBeInTheDocument();
    expect(screen.getByText("Memuat cash clarity...")).toBeInTheDocument();
  });

  it("renders dashboard sections after successful fetch", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/dashboard/warehouse")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              totalVariants: 12,
              lowStockCount: 2,
              lowStockItems: [
                {
                  variantId: "variant-1",
                  sku: "SKU-001",
                  productName: "Produk A",
                  variantName: "Varian Merah",
                  unit: "pcs",
                  currentStockQuantity: 3,
                  isLowStock: true,
                },
                {
                  variantId: "variant-2",
                  sku: "SKU-002",
                  productName: "Produk B",
                  variantName: "Varian Biru",
                  unit: "pcs",
                  currentStockQuantity: 1,
                  isLowStock: true,
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            cashInTotal: 250000,
            outstandingTotal: 50000,
            paymentEvents: [
              {
                paymentId: "payment-1",
                paymentDate: "2026-04-19T00:00:00.000Z",
                amount: 100000,
                method: "CASH",
                orderId: "order-1",
              },
              {
                paymentId: "payment-2",
                paymentDate: "2026-04-18T00:00:00.000Z",
                amount: 150000,
                method: "TRANSFER",
                orderId: "order-3",
              },
            ],
            outstandingOrders: [
              {
                orderId: "order-2",
                createdAt: "2026-04-18T00:00:00.000Z",
                totalAmount: 150000,
                outstandingAmount: 50000,
              },
            ],
          }),
          { status: 200 },
        ),
      );
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: "Low Stock" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Outstanding" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cash Clarity" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Total Variants")).toBeInTheDocument();
    expect(screen.getByText("Cash In Total")).toBeInTheDocument();
    expect(screen.getByText("Outstanding Total")).toBeInTheDocument();

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByText("Produk A")).toBeInTheDocument();
    expect(screen.getByText("Produk B")).toBeInTheDocument();
    expect(screen.getByText("Varian Merah")).toBeInTheDocument();
    expect(screen.getByText("Varian Biru")).toBeInTheDocument();

    expect(screen.getByText("Order order-1")).toBeInTheDocument();
    expect(screen.getByText("Order order-3")).toBeInTheDocument();
    expect(screen.getByText("Order order-2")).toBeInTheDocument();

    expect(screen.getByText("CASH")).toBeInTheDocument();
    expect(screen.getByText("TRANSFER")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows empty state when data is empty", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/dashboard/warehouse")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              totalVariants: 0,
              lowStockCount: 0,
              lowStockItems: [],
            }),
            { status: 200 },
          ),
        );
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            cashInTotal: 0,
            outstandingTotal: 0,
            paymentEvents: [],
            outstandingOrders: [],
          }),
          { status: 200 },
        ),
      );
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Tidak ada item low stock."),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Tidak ada order outstanding."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Belum ada payment event pada halaman ini."),
    ).toBeInTheDocument();
  });

  it("shows error per section when both fetches fail", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Summary dashboard tidak dapat ditampilkan penuh karena salah satu sumber gagal dimuat.",
        ),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Gagal memuat low stock dan summary warehouse."),
    ).toBeInTheDocument();

    const errorMessages = screen.getAllByText(
      "Gagal memuat cash clarity dan outstanding.",
    );

    expect(errorMessages).toHaveLength(2);
  });

  it("shows partial error when one fetch fails", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/dashboard/warehouse")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              totalVariants: 5,
              lowStockCount: 1,
              lowStockItems: [
                {
                  variantId: "variant-1",
                  sku: "SKU-001",
                  productName: "Produk A",
                  variantName: "Varian Merah",
                  unit: "pcs",
                  currentStockQuantity: 2,
                  isLowStock: true,
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }

      return Promise.resolve(new Response(null, { status: 500 }));
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Summary dashboard tidak dapat ditampilkan penuh karena salah satu sumber gagal dimuat.",
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Produk A")).toBeInTheDocument();

    const errorMessages = screen.getAllByText(
      "Gagal memuat cash clarity dan outstanding.",
    );

    expect(errorMessages).toHaveLength(2);
  });
});