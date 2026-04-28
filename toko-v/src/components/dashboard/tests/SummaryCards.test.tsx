import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryCards } from "../SummaryCards";

describe("SummaryCards", () => {
  it("renders all summary values", () => {
    render(
      <SummaryCards
        totalVariants={3}
        lowStockCount={1}
        cashInTotal={100000}
        outstandingTotal={50000}
      />,
    );

    expect(screen.getByText("Ringkasan Operasional")).toBeInTheDocument();
    expect(screen.getByText("Total Variant Aktif")).toBeInTheDocument();
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
    expect(screen.getByText("Kas Masuk")).toBeInTheDocument();
    expect(screen.getByText("Outstanding")).toBeInTheDocument();

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Rp 100.000")).toBeInTheDocument();
    expect(screen.getByText("Rp 50.000")).toBeInTheDocument();
  });

  it("renders zero values without crashing", () => {
    render(
      <SummaryCards
        totalVariants={0}
        lowStockCount={0}
        cashInTotal={0}
        outstandingTotal={0}
      />,
    );

    expect(screen.getByText("Total Variant Aktif")).toBeInTheDocument();
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
    expect(screen.getByText("Kas Masuk")).toBeInTheDocument();
    expect(screen.getByText("Outstanding")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 0").length).toBeGreaterThan(0);
  });
});