import { beforeEach, describe, expect, it } from "vitest";

import { PayCredit } from "@/modules/sales/application/PayCredit";
import { Order } from "@/modules/sales/domain/Order";
import { OrderStatus } from "@/modules/sales/domain/OrderStatus";
import { OrderType } from "@/modules/sales/domain/OrderType";
import {
  InvalidPaymentAmountError,
  OrderNotOnCreditError,
  PaymentOverpayError,
} from "@/modules/sales/domain/SalesErrors";
import { InMemoryOrderRepository } from "@/modules/sales/infrastructure/InMemoryOrderRepository";
import { InMemoryPaymentRepository } from "@/modules/sales/infrastructure/InMemoryPaymentRepository";
import { NotFoundError } from "@/shared/errors/ApplicationError";
import { EntityId } from "@/shared/value-objects/EntityId";

import { createDummyOrderItem } from "./dummy/createDummyOrderItem";
import { createOrderWithTotal } from "./dummy/createOrderWithTotal";

import { Money } from "@/shared/value-objects/Money";

import { FakeTransactionRunner } from "../tests/dummy/FakeTransactionRunner";

const actor = {
  id: "user-1",
  role: "KASIR" as const,
};

describe("PayCredit", () => {
  let orderRepository: InMemoryOrderRepository;
  let paymentRepository: InMemoryPaymentRepository;
  let fakeTransactionRunner: FakeTransactionRunner;
  let payCredit: PayCredit;

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository();
    paymentRepository = new InMemoryPaymentRepository();
    fakeTransactionRunner = new FakeTransactionRunner();
    payCredit = new PayCredit(
      orderRepository,
      paymentRepository,
      fakeTransactionRunner
    );
  });

  it("throws NotFoundError when order does not exist", async () => {
    await expect(
      payCredit.execute({
        orderId: "MISSING-ID",
        amount: 10_000,
        paidAt: new Date(),
        method: "CASH",
        actor,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws InvalidPaymentAmountError when amount <= 0", async () => {
    const orderId = "ORDER-INVALID-AMOUNT";

    const order = createOrderWithTotal({
      orderId,
      total: 10_000,
      createdBy: "user-1",
    });

    order.markAsCredit();
    await orderRepository.save(order);

    await expect(
      payCredit.execute({
        orderId,
        amount: 0,
        paidAt: new Date(),
        method: "CASH",
        actor,
      })
    ).rejects.toBeInstanceOf(InvalidPaymentAmountError);
  });

  it("throws OrderNotOnCreditError when order is still CREATED", async () => {
    const orderId = "ORDER-CREATED";

    const order = Order.create({
      id: EntityId.of(orderId),
      type: OrderType.OFFLINE,
      items: [createDummyOrderItem({ orderId })],
      createdAt: new Date(),
      createdBy: EntityId.of("user-1"),
    });

    await orderRepository.save(order);

    await expect(
      payCredit.execute({
        orderId,
        amount: 10_000,
        paidAt: new Date(),
        method: "CASH",
        actor,
      })
    ).rejects.toBeInstanceOf(OrderNotOnCreditError);
  });

  it("throws OrderNotOnCreditError when order already PAID", async () => {
    const orderId = "ORDER-PAID";

    const order = createOrderWithTotal({
      orderId,
      total: 10_000,
      createdBy: "user-1",
    });

    order.markAsCredit();
    order.recomputeOutstanding(Money.of(10_000));

    await orderRepository.save(order);

    await expect(
      payCredit.execute({
        orderId,
        amount: 1_000,
        paidAt: new Date(),
        method: "TRANSFER",
        actor,
      })
    ).rejects.toBeInstanceOf(OrderNotOnCreditError);
  });

  it("throws OrderNotOnCreditError when order already CANCELED", async () => {
    const orderId = "ORDER-CANCELED";

    const order = Order.create({
      id: EntityId.of(orderId),
      type: OrderType.OFFLINE,
      items: [createDummyOrderItem({ orderId })],
      createdAt: new Date(),
      createdBy: EntityId.of("user-1"),
    });

    order.cancel();
    await orderRepository.save(order);

    await expect(
      payCredit.execute({
        orderId,
        amount: 10_000,
        paidAt: new Date(),
        method: "CASH",
        actor,
      })
    ).rejects.toBeInstanceOf(OrderNotOnCreditError);
  });

  it("records partial payment and keeps order ON_CREDIT", async () => {
    const orderId = "ORDER-PARTIAL";

    const order = createOrderWithTotal({
      orderId,
      total: 10_000,
      createdBy: "user-1",
    });

    order.markAsCredit();
    await orderRepository.save(order);

    await payCredit.execute({
      orderId,
      amount: 4_000,
      paidAt: new Date(),
      method: "TRANSFER",
      actor,
    });

    const updatedOrder = await orderRepository.findById(EntityId.of(orderId));
    const totalPaid = await paymentRepository.sumAmountByOrderId(orderId);

    expect(updatedOrder).toBeDefined();
    expect(updatedOrder!.getStatus()).toBe(OrderStatus.ON_CREDIT);
    expect(updatedOrder!.getOutstandingAmount().get()).toBe(6_000);
    expect(updatedOrder!.getVersion()).toBe(1);
    expect(totalPaid).toBe(4_000);
  });

  it("marks order as PAID when fully settled", async () => {
    const orderId = "ORDER-FULL";

    const order = createOrderWithTotal({
      orderId,
      total: 50_000,
      createdBy: "user-1",
    });

    order.markAsCredit();
    await orderRepository.save(order);

    await payCredit.execute({
      orderId,
      amount: 50_000,
      paidAt: new Date(),
      method: "CASH",
      actor,
    });

    const updatedOrder = await orderRepository.findById(EntityId.of(orderId));
    const totalPaid = await paymentRepository.sumAmountByOrderId(orderId);

    expect(updatedOrder).toBeDefined();
    expect(updatedOrder!.getStatus()).toBe(OrderStatus.PAID);
    expect(updatedOrder!.getOutstandingAmount().isZero()).toBe(true);
    expect(updatedOrder!.getVersion()).toBe(1);
    expect(totalPaid).toBe(50_000);
  });

  it("rejects overpayment on single payment", async () => {
    const orderId = "ORDER-OVERPAY-1";

    const order = createOrderWithTotal({
      orderId,
      total: 30_000,
      createdBy: "user-1",
    });

    order.markAsCredit();
    await orderRepository.save(order);

    await expect(
      payCredit.execute({
        orderId,
        amount: 40_000,
        paidAt: new Date(),
        method: "CASH",
        actor,
      })
    ).rejects.toBeInstanceOf(PaymentOverpayError);
  });

  it("rejects overpayment after previous partial payment", async () => {
    const orderId = "ORDER-OVERPAY-2";

    const order = createOrderWithTotal({
      orderId,
      total: 30_000,
      createdBy: "user-1",
    });

    order.markAsCredit();
    await orderRepository.save(order);

    await payCredit.execute({
      orderId,
      amount: 10_000,
      paidAt: new Date(),
      method: "TRANSFER",
      actor,
    });

    await expect(
      payCredit.execute({
        orderId,
        amount: 25_000,
        paidAt: new Date(),
        method: "TRANSFER",
        actor,
      })
    ).rejects.toBeInstanceOf(PaymentOverpayError);

    const updatedOrder = await orderRepository.findById(EntityId.of(orderId));
    const totalPaid = await paymentRepository.sumAmountByOrderId(orderId);

    expect(updatedOrder!.getStatus()).toBe(OrderStatus.ON_CREDIT);
    expect(updatedOrder!.getOutstandingAmount().get()).toBe(20_000);
    expect(totalPaid).toBe(10_000);
    expect(updatedOrder!.getVersion()).toBe(1);
  });

  it("increments version for each successful settlement", async () => {
    const orderId = "ORDER-VERSION";

    const order = createOrderWithTotal({
      orderId,
      total: 30_000,
      createdBy: "user-1",
    });

    order.markAsCredit();
    await orderRepository.save(order);

    await payCredit.execute({
      orderId,
      amount: 10_000,
      paidAt: new Date(),
      method: "CASH",
      actor,
    });

    let updatedOrder = await orderRepository.findById(EntityId.of(orderId));
    expect(updatedOrder!.getVersion()).toBe(1);
    expect(updatedOrder!.getOutstandingAmount().get()).toBe(20_000);

    await payCredit.execute({
      orderId,
      amount: 20_000,
      paidAt: new Date(),
      method: "CASH",
      actor,
    });

    updatedOrder = await orderRepository.findById(EntityId.of(orderId));
    expect(updatedOrder!.getVersion()).toBe(2);
    expect(updatedOrder!.getStatus()).toBe(OrderStatus.PAID);
    expect(updatedOrder!.getOutstandingAmount().isZero()).toBe(true);
  });
});