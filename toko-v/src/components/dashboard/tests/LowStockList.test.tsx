import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LowStockList } from "../LowStockList";

describe("LowStockList", () => {
  it("renders only low stock items including unit", () => {
    render(
      <LowStockList
        items={[
          {
            variantId: "V001",
            sku: "SKU-001",
            productName: "Produk A",
            variantName: "Default",
            unit: "PCS",
            currentStockQuantity: 5,
            lowStockThreshold: 10,
            isLowStock: true,
          },
          {
            variantId: "V002",
            sku: "SKU-002",
            productName: "Produk B",
            variantName: "Besar",
            unit: "PCS",
            currentStockQuantity: 20,
            lowStockThreshold: 10,
            isLowStock: false,
          },
        ]}
      />,
    );

    expect(screen.getByText("Low Stock")).toBeInTheDocument();
    expect(screen.getByText("SKU-001")).toBeInTheDocument();
    expect(screen.getByText("Produk A")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("PCS")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(screen.queryByText("SKU-002")).not.toBeInTheDocument();
    expect(screen.queryByText("Produk B")).not.toBeInTheDocument();
    expect(screen.queryByText("Besar")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Tidak ada variant low stock saat ini."),
    ).not.toBeInTheDocument();
  });

  it("renders empty state when all items are not low stock", () => {
    render(
      <LowStockList
        items={[
          {
            variantId: "V001",
            sku: "SKU-001",
            productName: "Produk A",
            variantName: "Default",
            unit: "PCS",
            currentStockQuantity: 20,
            lowStockThreshold: 10,
            isLowStock: false,
          },
        ]}
      />,
    );

    expect(
      screen.getByText("Tidak ada variant low stock saat ini."),
    ).toBeInTheDocument();

    expect(screen.queryByText("SKU-001")).not.toBeInTheDocument();
    expect(screen.queryByText("Produk A")).not.toBeInTheDocument();
    expect(screen.queryByText("PCS")).not.toBeInTheDocument();
  });

  it("renders empty state when items are empty", () => {
    render(<LowStockList items={[]} />);

    expect(screen.getByText("Low Stock")).toBeInTheDocument();
    expect(
      screen.getByText("Tidak ada variant low stock saat ini."),
    ).toBeInTheDocument();
  });
});