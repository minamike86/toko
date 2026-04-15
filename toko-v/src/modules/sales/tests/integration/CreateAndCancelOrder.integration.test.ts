import "./_bootstrap";
import { salesPrisma as prisma } from "./_bootstrap";

import { describe, it, expect } from "vitest";

import { createOrder, cancelOrder } from "@/wiring/container";
import { seedInventory } from "@/tests/helpers/seedInventory";
import { OrderStatus } from "@/modules/sales/domain/OrderStatus";
import { OrderType } from "@/modules/sales/domain/OrderType";

describe("Integration: CreateOrder → Inventory → CancelOrder", () => {
  it("creates CASH OFFLINE order (PAID), reduces stock, then cancels and restores stock", async () => {
    const PRODUCT_ID = "P001";
    const VARIANT_ID = "V001";
    const INITIAL_STOCK = 10;
    const ORDER_QTY = 2;
    const ORDER_ID = "ORDER-1";

    const salesActor = {
      actorId: "user-1",
      role: "SALES" as const,
    };

    const adminActor = {
      actorId: "admin-1",
      role: "ADMIN" as const,
    };

    // Seed catalog source of truth untuk CreateOrder
    await prisma.product.upsert({
      where: { id: PRODUCT_ID },
      update: {
        name: "Produk Test",
        isActive: true,
      },
      create: {
        id: PRODUCT_ID,
        name: "Produk Test",
        brand: null,
        isActive: true,
      },
    });

    await prisma.productVariant.upsert({
      where: { id: VARIANT_ID },
      update: {
        productId: PRODUCT_ID,
        sku: "SKU-V001",
        variantName: "Default",
        unit: "pcs",
        basePrice: 10000,
        isActive: true,
      },
      create: {
        id: VARIANT_ID,
        productId: PRODUCT_ID,
        sku: "SKU-V001",
        variantName: "Default",
        unit: "pcs",
        sizeLabel: null,
        colorLabel: null,
        basePrice: 10000,
        isActive: true,
      },
    });

    await seedInventory(prisma, {
      productId: PRODUCT_ID,
      variantId: VARIANT_ID,
      quantity: INITIAL_STOCK,
    });

    const inventoryBefore = await prisma.inventoryItem.findFirst({
      where: { variantId: VARIANT_ID },
    });

    expect(inventoryBefore).toBeDefined();
    expect(inventoryBefore?.quantity).toBe(INITIAL_STOCK);

    await createOrder.execute({
      orderId: ORDER_ID,
      type: OrderType.OFFLINE,
      payment: "CASH",
      actor: salesActor,
      items: [
        {
          variantId: VARIANT_ID,
          quantity: ORDER_QTY,
        },
      ],
    });

    const orderAfterCreate = await prisma.order.findUnique({
      where: { id: ORDER_ID },
    });

    expect(orderAfterCreate).toBeDefined();
    expect(orderAfterCreate?.status).toBe(OrderStatus.PAID);
    expect(orderAfterCreate?.outstandingAmount).toBe(0);

    const inventoryAfterCreate = await prisma.inventoryItem.findFirst({
      where: { variantId: VARIANT_ID },
    });

    expect(inventoryAfterCreate?.quantity).toBe(INITIAL_STOCK - ORDER_QTY);

    await cancelOrder.execute({
      orderId: ORDER_ID,
      actor: adminActor,
    });

    const orderAfterCancel = await prisma.order.findUnique({
      where: { id: ORDER_ID },
    });

    expect(orderAfterCancel?.status).toBe(OrderStatus.CANCELED);

    const inventoryAfterCancel = await prisma.inventoryItem.findFirst({
      where: { variantId: VARIANT_ID },
    });

    expect(inventoryAfterCancel?.quantity).toBe(INITIAL_STOCK);
  });
});