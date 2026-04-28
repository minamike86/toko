import { describe, expect, it } from "vitest";
import {
  itemInitial,
  resolvePageTitle,
  shouldUseOperationalShell,
} from "@/components/shell/shell-navigation";

describe("shell-navigation", () => {
  it("detects shell routes correctly", () => {
    expect(shouldUseOperationalShell("/dashboard")).toBe(true);
    expect(shouldUseOperationalShell("/pos")).toBe(true);
    expect(shouldUseOperationalShell("/inventory")).toBe(true);
    expect(shouldUseOperationalShell("/admin/system")).toBe(true);
    expect(shouldUseOperationalShell("/api/orders")).toBe(false);
  });

  it("resolves active page title correctly", () => {
    expect(resolvePageTitle("/dashboard")).toBe("Dashboard");
    expect(resolvePageTitle("/pos")).toBe("Sales");
    expect(resolvePageTitle("/inventory")).toBe("Inventory");
    expect(resolvePageTitle("/procurement")).toBe("Procurement");
    expect(resolvePageTitle("/admin/system")).toBe("System");
  });

  it("returns uppercase initial", () => {
    expect(itemInitial("dashboard")).toBe("D");
    expect(itemInitial("Sales")).toBe("S");
  });
});