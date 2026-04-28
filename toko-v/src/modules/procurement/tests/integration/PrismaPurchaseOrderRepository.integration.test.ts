import { beforeEach, describe, expect, it } from "vitest";
import { PrismaPurchaseOrderRepository } from "@/modules/procurement/infrastructure/prisma/PrismaPurchaseOrderRepository";
import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PURCHASE_ORDER_STATUSES } from "@/modules/procurement/domain/PurchaseOrderStatus";
import { PurchaseOrderStatusInvalidError } from "@/modules/procurement/domain/ProcurementErrors";
import { prisma } from "@/shared/prisma";

describe("PrismaPurchaseOrderRepository integration", () => {
  const repository = new PrismaPurchaseOrderRepository();

  beforeEach(async () => {
    await prisma.purchaseReturnReductionItem.deleteMany();
    await prisma.purchaseReturnReduction.deleteMany();
    await prisma.supplierPayment.deleteMany();

    await prisma.purchaseItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.supplier.deleteMany();

    await prisma.supplier.create({
      data: {
        id: "sup-1",
        storeName: "Toko Benang Makmur",
        salesName: null,
        phone: null,
        notes: null,
        isActive: true,
        createdAt: new Date("2026-04-04T00:00:00.000Z"),
      },
    });
  });

  function createOrder(): PurchaseOrder {
    const orderId = repository.nextId();

    const itemA = PurchaseItem.create({
      id: repository.nextItemId(),
      purchaseOrderId: orderId,
      productId: "prod-1",
      variantId: "var-1",
      productNameSnapshot: "Benang Katun",
      variantNameSnapshot: "Merah",
      unitSnapshot: "pcs",
      quantity: 2,
      unitCost: 10000,
    });

    const itemB = PurchaseItem.create({
      id: repository.nextItemId(),
      purchaseOrderId: orderId,
      productId: "prod-2",
      variantId: "var-2",
      productNameSnapshot: "Benang Sutra",
      variantNameSnapshot: "Biru",
      unitSnapshot: "pcs",
      quantity: 3,
      unitCost: 20000,
    });

    return PurchaseOrder.create({
      id: orderId,
      supplierId: "sup-1",
      items: [itemA, itemB],
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
      createdBy: "user-1",
    });
  }

  it("saves and finds purchase order with items", async () => {
    const order = createOrder();

    await repository.save(order);

    const found = await repository.findById(order.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(order.id);
    expect(found?.supplierId).toBe("sup-1");
    expect(found?.status).toBe(PURCHASE_ORDER_STATUSES.CREATED);
    expect(found?.items).toHaveLength(2);
    expect(found?.totalQuantity).toBe(5);
    expect(found?.totalCost).toBe(80000);
  });

  it("updates status when order is received", async () => {
    const order = createOrder();

    await repository.save(order);

    order.receive({
      receivedAt: new Date("2026-04-05T00:00:00.000Z"),
      receivedBy: "user-2",
    });

    await repository.save(order);

    const found = await repository.findById(order.id);

    expect(found).not.toBeNull();
    expect(found?.status).toBe(PURCHASE_ORDER_STATUSES.RECEIVED);
    expect(found?.receivedBy).toBe("user-2");
  });

  it("throws when database contains invalid purchase order status", async () => {
    const order = createOrder();

    await repository.save(order);

    await prisma.purchaseOrder.update({
      where: { id: order.id },
      data: {
        status: "PAID",
      },
    });

    await expect(repository.findById(order.id)).rejects.toThrowError(
      PurchaseOrderStatusInvalidError,
    );
  });
});