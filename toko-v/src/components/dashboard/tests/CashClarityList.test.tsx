import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CashClarityList } from "../CashClarityList";

describe("CashClarityList", () => {
  it("renders payment events and total cash in", () => {
    render(
      <CashClarityList
        period={{
          from: new Date("2026-04-01T00:00:00.000Z"),
          to: new Date("2026-04-02T00:00:00.000Z"),
        }}
        cashInTotal={100000}
        paymentEvents={[
          {
            paymentId: "PAY-001",
            paymentDate: new Date("2026-04-02T11:00:00.000Z"),
            amount: 100000,
            method: "LEGACY",
            orderId: "ORD-001",
          },
        ]}
      />,
    );

    expect(screen.getByText("Cash Clarity")).toBeInTheDocument();
    expect(screen.getByText(/Periode:/)).toBeInTheDocument();
    expect(screen.getAllByText("Rp 100.000").length).toBeGreaterThan(0);
    expect(screen.getByText("PAY-001")).toBeInTheDocument();
    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getByText("LEGACY")).toBeInTheDocument();
  });

  it("renders empty state when no payment events exist", () => {
    render(
      <CashClarityList
        period={{
          from: new Date("2026-04-01T00:00:00.000Z"),
          to: new Date("2026-04-02T00:00:00.000Z"),
        }}
        cashInTotal={0}
        paymentEvents={[]}
      />,
    );

    expect(screen.getByText("Cash Clarity")).toBeInTheDocument();
    expect(
      screen.getByText("Belum ada payment event pada periode ini."),
    ).toBeInTheDocument();
  });
});