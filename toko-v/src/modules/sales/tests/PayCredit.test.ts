import { describe, it, expect, beforeEach } from "vitest";

import { PayCredit } from "@/modules/sales/application/PayCredit";
import { Order } from "@/modules/sales/domain/Order";
import { OrderStatus } from "@/modules/sales/domain/OrderStatus";
import { OrderType } from "@/modules/sales/domain/OrderType";
import { EntityId } from "@/shared/value-objects/EntityId";
import { NotFoundError } from "@/shared/errors/ApplicationError";

import { InMemoryOrderRepository } from "@/modules/sales/infrastructure/InMemoryOrderRepository";
import { createDummyOrderItem } from "./dummy/createDummyOrderItem";

const actor = {
  id: "user-1",
  role: "KASIR" as const,
};

describe("PayCredit Use Case", () => {
  let orderRepo: InMemoryOrderRepository;
  let useCase: PayCredit;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    useCase = new PayCredit(orderRepo);
  });

  it("marks order as PAID when order is ON_CREDIT", async () => {
    const orderId = "ORDER-1";

    const order = Order.create({
      id: EntityId.of(orderId),
      type: OrderType.OFFLINE,
      items: [createDummyOrderItem(orderId)],
      createdAt: new Date(),
      createdBy: EntityId.of("user-1"),
    });

    order.markAsCredit();
    orderRepo.seed(order);

    await useCase.execute({ orderId, actor });

    expect(order.getStatus()).toBe(OrderStatus.PAID);
  });

  it("throws error when order is not ON_CREDIT", async () => {
    const orderId = "ORDER-2";

    const order = Order.create({
      id: EntityId.of(orderId),
      type: OrderType.OFFLINE,
      items: [createDummyOrderItem(orderId)],
      createdAt: new Date(),
      createdBy: EntityId.of("user-1"),
    });

    // status CREATED
    orderRepo.seed(order);

    await expect(
      useCase.execute({ orderId, actor })
    ).rejects.toThrow();
  });

  it("throws error when order already PAID", async () => {
    const orderId = "ORDER-3";

    const order = Order.create({
      id: EntityId.of(orderId),
      type: OrderType.OFFLINE,
      items: [createDummyOrderItem(orderId)],
      createdAt: new Date(),
      createdBy: EntityId.of("user-1"),
    });

    order.markAsPaid();
    orderRepo.seed(order);

    await expect(
      useCase.execute({ orderId, actor })
    ).rejects.toThrow();
  });

  it("throws error when order already CANCELED", async () => {
    const orderId = "ORDER-4";

    const order = Order.create({
      id: EntityId.of(orderId),
      type: OrderType.OFFLINE,
      items: [createDummyOrderItem(orderId)],
      createdAt: new Date(),
      createdBy: EntityId.of("user-1"),
    });

    order.cancel();
    orderRepo.seed(order);

    await expect(
      useCase.execute({ orderId, actor })
    ).rejects.toThrow();
  });

  it("throws NotFoundError when order does not exist", async () => {
    await expect(
      useCase.execute({ orderId: "MISSING-ID", actor })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
