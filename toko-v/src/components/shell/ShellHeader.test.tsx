import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShellHeader } from "@/components/shell/ShellHeader";

describe("ShellHeader", () => {
  it("renders active page title", () => {
    render(<ShellHeader pageTitle="Dashboard" hasSidebar={true} />);

    expect(screen.getByText("Operasional")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Presentational shell")).toBeInTheDocument();
  });

  it("keeps presentational label when sidebar is hidden", () => {
    render(<ShellHeader pageTitle="Sales" hasSidebar={false} />);

    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("Presentational shell")).toBeInTheDocument();
  });
});