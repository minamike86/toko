import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * SALES
 */
import { CreateOrder } from "@/modules/sales/application/CreateOrder";
import { CancelOrder } from "@/modules/sales/application/CancelOrder";
import { PrismaOrderRepository } from "@/modules/sales/infrastructure/PrismaOrderRepository";
import { OrderType } from "@/modules/sales/domain/OrderType";


/**
 * INVENTORY
 */
import { PrismaInventoryRepository } from "@/modules/inventory/infrastructure/PrismaInventoryRepository";
import { IssueStock } from "@/modules/inventory/application/IssueStock";
import { ReceiveStock } from "@/modules/inventory/application/ReceiveStock";
import { InventoryServiceAdapter } from "@/modules/inventory/infrastructure/InventoryServiceAdapter";

/**
 * CATALOG (READ)
 */
import { InMemoryCatalogReadRepository } from "@/modules/catalog/infrastructure/InMemoryCatalogReadRepository";

/**
 * PRISMA
 */
const prisma = new PrismaClient();

describe("Integration: CreateOrder → Inventory → CancelOrder", () => {
  beforeEach(async () => {
    // urutan penting (FK)
    await prisma.stockMovement.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();

    // seed inventory
    await prisma.inventoryItem.create({
      data: {
        productId: "P001",
        quantity: 10,
      },
    });
  });

  it("creates PAID order, reduces stock, then cancels and restores stock", async () => {
    // =========================
    // REPOSITORIES
    // =========================
    const orderRepo = new PrismaOrderRepository(prisma);
    const inventoryRepo = new PrismaInventoryRepository(prisma);

    // =========================
    // INVENTORY USE CASES
    // =========================
    const issueStock = new IssueStock(inventoryRepo);
    const receiveStock = new ReceiveStock(inventoryRepo);

    const inventoryService = new InventoryServiceAdapter(
      issueStock,
      receiveStock
    );

    // =========================
    // CATALOG (READ-ONLY)
    // =========================
    const catalogReadRepo = new InMemoryCatalogReadRepository([
      {
        productId: "P001",
        name: "Produk A",
        unit: "pcs",
        price: 10000,
        isActive: true,
      },
    ]);

    // =========================
    // SALES USE CASES
    // =========================
    const createOrder = new CreateOrder({
      orderRepo,
      catalogReadRepo,
      inventoryService,
    });

    const cancelOrder = new CancelOrder({
      orderRepo,
      inventoryService,
    });

    // =========================
    // ACT: CREATE ORDER
    // =========================
    const createResult = await createOrder.execute({
  orderId: "ORDER-1",
  type: OrderType.OFFLINE,
  payment: "CASH",
  createdBy: "tester",
  items: [
    {
      productId: "P001",
      quantity: 3,
    },
  ],
});

    expect(createResult.status).toBe("PAID");

    const stockAfterCreate = await prisma.inventoryItem.findUnique({
      where: { productId: "P001" },
    });

    expect(stockAfterCreate?.quantity).toBe(7);

    // =========================
    // ACT: CANCEL ORDER
    // =========================
    const cancelResult = await cancelOrder.execute({
      orderId: "ORDER-1",
      canceledBy: "tester",
    });

    expect(cancelResult.status).toBe("CANCELED");

    const stockAfterCancel = await prisma.inventoryItem.findUnique({
      where: { productId: "P001" },
    });

    expect(stockAfterCancel?.quantity).toBe(10);

    // =========================
    // ASSERT STOCK MOVEMENTS
    // =========================
    const movements = await prisma.stockMovement.findMany({
      where: { productId: "P001" },
      orderBy: { occurredAt: "asc" },
    });

    expect(movements).toHaveLength(2);

    expect(movements[0]).toMatchObject({
      type: "OUT",
      quantity: 3,
      reason: "SALE_ORDER",
      referenceId: "ORDER-1",
    });

    expect(movements[1]).toMatchObject({
      type: "IN",
      quantity: 3,
      reason: "CANCEL_ORDER",
      referenceId: "ORDER-1",
    });
  });
});
