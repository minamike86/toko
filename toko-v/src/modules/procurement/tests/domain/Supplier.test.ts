import { describe, expect, it } from "vitest";
import { Supplier } from "@/modules/procurement/domain/Supplier";
import {
  InvalidSupplierStoreNameError,
  SupplierInactiveError,
} from "@/modules/procurement/domain/ProcurementErrors";

describe("Supplier", () => {
  it("creates active supplier by default", () => {
    const supplier = Supplier.create({
      id: "sup-1",
      storeName: "  Toko Benang Makmur  ",
      salesName: "  Budi  ",
      phone: " 08123 ",
      notes: " supplier utama ",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    expect(supplier.id).toBe("sup-1");
    expect(supplier.storeName).toBe("Toko Benang Makmur");
    expect(supplier.salesName).toBe("Budi");
    expect(supplier.phone).toBe("08123");
    expect(supplier.notes).toBe("supplier utama");
    expect(supplier.isActive).toBe(true);
  });

  it("throws when store name is empty", () => {
    expect(() =>
      Supplier.create({
        id: "sup-1",
        storeName: "   ",
        createdAt: new Date("2026-04-04T00:00:00.000Z"),
      }),
    ).toThrowError(InvalidSupplierStoreNameError);
  });

  it("throws when inactive supplier is used for new purchase order", () => {
    const supplier = Supplier.create({
      id: "sup-1",
      storeName: "Toko Benang Makmur",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    supplier.deactivate();

    expect(() => supplier.assertCanBeUsedForNewPurchaseOrder()).toThrowError(
      SupplierInactiveError,
    );
  });

  it("updates contact info without changing identity", () => {
    const supplier = Supplier.create({
      id: "sup-1",
      storeName: "Toko A",
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
    });

    supplier.updateContactInfo({
      storeName: " Toko B ",
      salesName: " Sari ",
      phone: " 08111 ",
      notes: " prioritas ",
    });

    expect(supplier.id).toBe("sup-1");
    expect(supplier.storeName).toBe("Toko B");
    expect(supplier.salesName).toBe("Sari");
    expect(supplier.phone).toBe("08111");
    expect(supplier.notes).toBe("prioritas");
  });
});