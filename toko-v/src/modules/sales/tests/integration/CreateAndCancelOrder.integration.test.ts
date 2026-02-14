import "./_bootstrap";
import { salesPrisma as prisma } from "./_bootstrap";

import { describe, it, expect } from "vitest";

import { createOrder, cancelOrder } from "@/wiring/container";
import { seedInventory } from "@/tests/helpers/seedInventory";
import { OrderStatus } from "@/modules/sales/domain/OrderStatus";
import { OrderType } from "@/modules/sales/domain/OrderType";

describe("Integration: CreateOrder → Inventory → CancelOrder", () => {
  it("creates CASH OFFLINE order (PAID), reduces stock, then cancels and restores stock", async () => {
    // ---------------------------------------------------------------------
    // GIVEN: inventory tersedia
    // ---------------------------------------------------------------------
    const PRODUCT_ID = "P001";
    const INITIAL_STOCK = 10;
    const ORDER_QTY = 2;
    const ORDER_ID = "ORDER-1";

    await seedInventory(prisma, {
      productId: PRODUCT_ID,
      quantity: INITIAL_STOCK,
    });

    const inventoryBefore = await prisma.inventoryItem.findUnique({
      where: { productId: PRODUCT_ID },
    });

    expect(inventoryBefore?.quantity).toBe(INITIAL_STOCK);

    // ---------------------------------------------------------------------
    // WHEN: order OFFLINE + CASH dibuat
    // ---------------------------------------------------------------------
    await createOrder.execute({
      orderId: ORDER_ID,
      type: OrderType.OFFLINE,
      createdBy: "user-1",
      payment: "CASH",
      items: [
        {
          productId: PRODUCT_ID,
          quantity: ORDER_QTY,
        },
      ],
    });

    // ---------------------------------------------------------------------
    // THEN: order langsung PAID (domain rule)
    // ---------------------------------------------------------------------
    const orderAfterCreate = await prisma.order.findUnique({
      where: { id: ORDER_ID },
    });

    expect(orderAfterCreate).toBeDefined();
    expect(orderAfterCreate?.status).toBe(OrderStatus.PAID);
    expect(orderAfterCreate?.outstandingAmount).toBe(0);

    // ---------------------------------------------------------------------
    // AND: stok berkurang
    // ---------------------------------------------------------------------
    const inventoryAfterCreate = await prisma.inventoryItem.findUnique({
      where: { productId: PRODUCT_ID },
    });

    expect(inventoryAfterCreate?.quantity).toBe(
      INITIAL_STOCK - ORDER_QTY
    );

    // ---------------------------------------------------------------------
    // WHEN: order dibatalkan
    // ---------------------------------------------------------------------
    await cancelOrder.execute({
      orderId: ORDER_ID,
      canceledBy: "user-1",
    });

    // ---------------------------------------------------------------------
    // THEN: status order CANCELED
    // ---------------------------------------------------------------------
    const orderAfterCancel = await prisma.order.findUnique({
      where: { id: ORDER_ID },
    });

    expect(orderAfterCancel?.status).toBe(OrderStatus.CANCELED);

    // ---------------------------------------------------------------------
    // AND: stok dikembalikan penuh
    // ---------------------------------------------------------------------
    const inventoryAfterCancel = await prisma.inventoryItem.findUnique({
      where: { productId: PRODUCT_ID },
    });

    expect(inventoryAfterCancel?.quantity).toBe(INITIAL_STOCK);
  });
});
