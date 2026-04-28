import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OutstandingList } from "../OutstandingList";

describe("OutstandingList", () => {
  it("renders outstanding orders and total", () => {
    render(
      <OutstandingList
        outstandingTotal={250000}
        outstandingOrders={[
          {
            orderId: "ORD-001",
            createdAt: new Date("2026-04-01T10:00:00.000Z"),
            totalAmount: 300000,
            outstandingAmount: 250000,
          },
        ]}
      />,
    );

    expect(screen.getAllByText("Outstanding").length).toBeGreaterThan(0);
    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getByText("Rp 300.000")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 250.000").length).toBeGreaterThan(0);
  });

  it("renders empty state when no outstanding orders exist", () => {
    render(
      <OutstandingList
        outstandingTotal={0}
        outstandingOrders={[]}
      />,
    );

    expect(
      screen.getByText("Tidak ada order outstanding saat ini."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Rp 0").length).toBeGreaterThan(0);
  });
});