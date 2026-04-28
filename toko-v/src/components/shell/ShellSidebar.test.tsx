import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShellSidebar } from "@/components/shell/ShellSidebar";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("ShellSidebar", () => {
  it("renders minimum navigation items", () => {
    render(
      <ShellSidebar
        pathname="/dashboard"
        isCollapsed={false}
        onToggleCollapse={() => { }}
      />,
    );

    expect(
      screen.getByRole("link", { name: /dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sales/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /inventory/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Procurement")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /system/i })).toBeInTheDocument();
  });

  it("marks active navigation item based on pathname", () => {
    render(
      <ShellSidebar
        pathname="/inventory"
        isCollapsed={false}
        onToggleCollapse={() => { }}
      />,
    );

    expect(screen.getByRole("link", { name: /inventory/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps procurement as non-interactive placeholder", () => {
    render(
      <ShellSidebar
        pathname="/dashboard"
        isCollapsed={false}
        onToggleCollapse={() => { }}
      />,
    );

    expect(
      screen.queryByRole("link", { name: /procurement/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Procurement")).toBeInTheDocument();
  });

  it("calls toggle collapse handler", () => {
    const onToggleCollapse = vi.fn();

    render(
      <ShellSidebar
        pathname="/dashboard"
        isCollapsed={false}
        onToggleCollapse={onToggleCollapse}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    );

    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("keeps navigation usable in collapsed state", () => {
    render(
      <ShellSidebar
        pathname="/dashboard"
        isCollapsed={true}
        onToggleCollapse={() => { }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "D" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "S" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "I" })).toBeInTheDocument();

    expect(screen.getByTitle("Dashboard")).toBeInTheDocument();
    expect(screen.getByTitle("Sales")).toBeInTheDocument();
    expect(screen.getByTitle("Inventory")).toBeInTheDocument();
    expect(screen.getByTitle("Procurement")).toBeInTheDocument();
    expect(screen.getByTitle("System")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "D" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});