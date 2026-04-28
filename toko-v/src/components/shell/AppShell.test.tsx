import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/shell/AppShell";

let mockPathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("AppShell", () => {
  beforeEach(() => {
    mockPathname = "/dashboard";
  });

  it("renders operational shell for dashboard route", () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.getByText("Sistem Jual Beli Terpadu")).toBeInTheDocument();
    expect(screen.getByText("Presentational shell")).toBeInTheDocument();
  });

  it("does not render operational shell for non-shell route", () => {
    mockPathname = "/api/orders";

    render(
      <AppShell>
        <div>API content</div>
      </AppShell>,
    );

    expect(screen.getByText("API content")).toBeInTheDocument();
    expect(
      screen.queryByText("Sistem Jual Beli Terpadu"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Presentational shell")).not.toBeInTheDocument();
  });

  it("renders shell for sales route", () => {
    mockPathname = "/pos";

    render(
      <AppShell>
        <div>POS content</div>
      </AppShell>,
    );

    expect(screen.getByText("POS content")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /sales/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByText("Sales")).toHaveLength(2);
  });

  it("hides sidebar when floating toggle is clicked", () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByText("Sistem Jual Beli Terpadu")).toBeInTheDocument();

    const toggleButton = screen.getByRole("button", { name: "Hide sidebar" });

    fireEvent.pointerDown(toggleButton, {
      clientX: 20,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerUp(toggleButton, {
      clientX: 20,
      clientY: 100,
      pointerId: 1,
    });

    expect(
      screen.queryByText("Sistem Jual Beli Terpadu"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show sidebar" }),
    ).toBeInTheDocument();
  });

  it("collapses sidebar without removing navigation access", () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    );

    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toBeInTheDocument();

    expect(screen.getByTitle("Dashboard")).toBeInTheDocument();
    expect(screen.getByTitle("Sales")).toBeInTheDocument();
    expect(screen.getByTitle("Inventory")).toBeInTheDocument();
    expect(screen.getByTitle("Procurement")).toBeInTheDocument();
    expect(screen.getByTitle("System")).toBeInTheDocument();
  });
});