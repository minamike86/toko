import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShellFloatingToggle } from "@/components/shell/ShellFloatingToggle";

describe("ShellFloatingToggle", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
    });

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 720,
    });
  });

  it("calls onToggle when clicked (no drag)", () => {
    const onToggle = vi.fn();

    render(
      <ShellFloatingToggle
        isSidebarHidden={false}
        onToggle={onToggle}
      />,
    );

    const button = screen.getByRole("button", { name: "Hide sidebar" });

    fireEvent.pointerDown(button, {
      clientX: 20,
      clientY: 100,
      pointerId: 1,
    });

    fireEvent.pointerUp(button, {
      clientX: 20,
      clientY: 100,
      pointerId: 1,
    });

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("does not call onToggle when dragged", () => {
    const onToggle = vi.fn();

    render(
      <ShellFloatingToggle
        isSidebarHidden={false}
        onToggle={onToggle}
      />,
    );

    const button = screen.getByRole("button", { name: "Hide sidebar" });

    fireEvent.pointerDown(button, {
      clientX: 20,
      clientY: 100,
      pointerId: 1,
    });

    fireEvent.pointerMove(button, {
      clientX: 200,
      clientY: 240,
      pointerId: 1,
    });

    fireEvent.pointerUp(button, {
      clientX: 200,
      clientY: 240,
      pointerId: 1,
    });

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("renders show label when sidebar is hidden", () => {
    render(
      <ShellFloatingToggle
        isSidebarHidden={true}
        onToggle={() => { }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Show sidebar" }),
    ).toBeInTheDocument();
  });

  it("keeps button inside viewport when dragged", () => {
    render(
      <ShellFloatingToggle
        isSidebarHidden={false}
        onToggle={() => { }}
      />,
    );

    const button = screen.getByRole("button", { name: "Hide sidebar" });

    fireEvent.pointerDown(button, {
      clientX: 20,
      clientY: 100,
      pointerId: 1,
    });

    fireEvent.pointerMove(button, {
      clientX: 5000,
      clientY: 5000,
      pointerId: 1,
    });

    fireEvent.pointerUp(button, {
      clientX: 5000,
      clientY: 5000,
      pointerId: 1,
    });

    const left = parseFloat(button.style.left);
    const top = parseFloat(button.style.top);

    expect(left).toBeLessThanOrEqual(1280 - 48 - 12);
    expect(top).toBeLessThanOrEqual(720 - 48 - 12);

    expect(left).toBeGreaterThanOrEqual(12);
    expect(top).toBeGreaterThanOrEqual(12);
  });
});