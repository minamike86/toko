import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/shared/prisma";

import { PayCredit } from "@/modules/sales/application/PayCredit";
import { Order } from "@/modules/sales/domain/Order";
import { OrderItem } from "@/modules/sales/domain/OrderItem";
import { OrderStatus } from "@/modules/sales/domain/OrderStatus";
import { OrderType } from "@/modules/sales/domain/OrderType";
import {
  OptimisticLockConflictError,
  OrderNotOnCreditError,
  PaymentOverpayError,
} from "@/modules/sales/domain/SalesErrors";
import { PrismaOrderRepository } from "@/modules/sales/infrastructure/PrismaOrderRepository";
import { PrismaPaymentRepository } from "@/modules/sales/infrastructure/PrismaPaymentRepository";
import { PrismaTransactionRunner } from "@/modules/sales/infrastructure/PrismaTransactionRunner";

import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { PositiveInt } from "@/shared/value-objects/PositiveInt";

const actor = {
  id: "user-1",
  role: "KASIR" as const,
};

function makeOrderItem(params: {
  id: string;
  productId: string;
  name?: string;
  unit?: string;
  unitPrice: number;
  quantity?: number;
}) {
  return OrderItem.create({
    id: EntityId.of(params.id),
    productId: EntityId.of(params.productId),
    productNameSnapshot: params.name ?? "Test Product",
    unitSnapshot: params.unit ?? "pcs",
    unitPriceSnapshot: Money.of(params.unitPrice),
    quantity: PositiveInt.of(params.quantity ?? 1),
  });
}

function makeCreditOrder(params: {
  orderId: string;
  total: number;
  createdBy: string;
}) {
  const item = makeOrderItem({
    id: `${params.orderId}-ITEM-1`,
    productId: `${params.orderId}-PRODUCT-1`,
    unitPrice: params.total,
    quantity: 1,
  });

  const order = Order.create({
    id: EntityId.of(params.orderId),
    type: OrderType.OFFLINE,
    items: [item],
    createdAt: new Date("2026-01-01T10:00:00.000Z"),
    createdBy: EntityId.of(params.createdBy),
  });

  order.markAsCredit();

  return order;
}

describe.sequential("PayCredit Prisma Integration", () => {
  const orderRepository = new PrismaOrderRepository(prisma);
  const paymentRepository = new PrismaPaymentRepository(prisma);
  const transactionRunner = new PrismaTransactionRunner(prisma);
  const payCredit = new PayCredit(
    orderRepository,
    paymentRepository,
    transactionRunner,
  );

  beforeEach(async () => {
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
  });

  it("records partial payment and persists payment fields", async () => {
    const orderId = "ORDER-PRISMA-PARTIAL";
    const paidAt = new Date("2026-01-02T09:30:00.000Z");

    const order = makeCreditOrder({
      orderId,
      total: 100_000,
      createdBy: "user-1",
    });

    await orderRepository.save(order);

    await payCredit.execute({
      orderId,
      amount: 40_000,
      paidAt,
      method: "TRANSFER",
      actor,
    });

    const updatedOrder = await orderRepository.findById(EntityId.of(orderId));
    const payments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { paidAt: "asc" },
    });

    expect(updatedOrder).not.toBeNull();
    expect(updatedOrder!.getStatus()).toBe(OrderStatus.ON_CREDIT);
    expect(updatedOrder!.getOutstandingAmount().get()).toBe(60_000);
    expect(updatedOrder!.getVersion()).toBe(1);

    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      orderId,
      amount: 40_000,
      method: "TRANSFER",
    });
    expect(payments[0].paidAt.toISOString()).toBe(paidAt.toISOString());
  });

  it("marks order PAID after full settlement and increments version twice", async () => {
    const orderId = "ORDER-PRISMA-FULL";

    const order = makeCreditOrder({
      orderId,
      total: 75_000,
      createdBy: "user-1",
    });

    await orderRepository.save(order);

    await payCredit.execute({
      orderId,
      amount: 25_000,
      paidAt: new Date("2026-01-03T08:00:00.000Z"),
      method: "CASH",
      actor,
    });

    await payCredit.execute({
      orderId,
      amount: 50_000,
      paidAt: new Date("2026-01-03T10:00:00.000Z"),
      method: "CASH",
      actor,
    });

    const updatedOrder = await orderRepository.findById(EntityId.of(orderId));
    const paymentSum = await paymentRepository.sumAmountByOrderId(orderId);
    const payments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { paidAt: "asc" },
    });

    expect(updatedOrder).not.toBeNull();
    expect(updatedOrder!.getStatus()).toBe(OrderStatus.PAID);
    expect(updatedOrder!.getOutstandingAmount().isZero()).toBe(true);
    expect(updatedOrder!.getVersion()).toBe(2);

    expect(paymentSum).toBe(75_000);
    expect(payments).toHaveLength(2);
    expect(payments[0].amount).toBe(25_000);
    expect(payments[1].amount).toBe(50_000);
  });

  it("rejects overpayment and does not create extra payment row", async () => {
    const orderId = "ORDER-PRISMA-OVERPAY";

    const order = makeCreditOrder({
      orderId,
      total: 30_000,
      createdBy: "user-1",
    });

    await orderRepository.save(order);

    await payCredit.execute({
      orderId,
      amount: 10_000,
      paidAt: new Date("2026-01-04T09:00:00.000Z"),
      method: "TRANSFER",
      actor,
    });

    await expect(
      payCredit.execute({
        orderId,
        amount: 25_000,
        paidAt: new Date("2026-01-04T10:00:00.000Z"),
        method: "TRANSFER",
        actor,
      }),
    ).rejects.toBeInstanceOf(PaymentOverpayError);

    const updatedOrder = await orderRepository.findById(EntityId.of(orderId));
    const payments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { paidAt: "asc" },
    });

    expect(updatedOrder).not.toBeNull();
    expect(updatedOrder!.getStatus()).toBe(OrderStatus.ON_CREDIT);
    expect(updatedOrder!.getOutstandingAmount().get()).toBe(20_000);
    expect(updatedOrder!.getVersion()).toBe(1);

    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(10_000);
  });

  it("prevents overpayment under race condition on the same order", async () => {
    const orderId = "ORDER-PRISMA-RACE";

    const order = makeCreditOrder({
      orderId,
      total: 100_000,
      createdBy: "user-1",
    });

    await orderRepository.save(order);

    const first = payCredit.execute({
      orderId,
      amount: 60_000,
      paidAt: new Date("2026-01-05T09:00:00.000Z"),
      method: "TRANSFER",
      actor,
    });

    const second = payCredit.execute({
      orderId,
      amount: 60_000,
      paidAt: new Date("2026-01-05T09:00:01.000Z"),
      method: "TRANSFER",
      actor,
    });

    const results = await Promise.allSettled([first, second]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;

    expect(
      rejectedReason instanceof PaymentOverpayError ||
      rejectedReason instanceof OptimisticLockConflictError ||
      rejectedReason instanceof OrderNotOnCreditError,
    ).toBe(true);

    const updatedOrder = await orderRepository.findById(EntityId.of(orderId));
    const paymentSum = await paymentRepository.sumAmountByOrderId(orderId);
    const payments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { paidAt: "asc" },
    });

    expect(updatedOrder).not.toBeNull();
    expect(updatedOrder!.getStatus()).toBe(OrderStatus.ON_CREDIT);
    expect(updatedOrder!.getOutstandingAmount().get()).toBe(40_000);
    expect(updatedOrder!.getVersion()).toBe(1);

    expect(paymentSum).toBe(60_000);
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(60_000);
  });

  it("prevents duplicate full settlement on double submit without idempotency key", async () => {
    const orderId = "ORDER-PRISMA-DOUBLE-SUBMIT";
    const paidAt = new Date("2026-01-06T11:00:00.000Z");
    const method = "TRANSFER";

    const order = makeCreditOrder({
      orderId,
      total: 50_000,
      createdBy: "user-1",
    });

    await orderRepository.save(order);

    const first = payCredit.execute({
      orderId,
      amount: 50_000,
      paidAt,
      method,
      actor,
    });

    const second = payCredit.execute({
      orderId,
      amount: 50_000,
      paidAt,
      method,
      actor,
    });

    const results = await Promise.allSettled([first, second]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;

    expect(
      rejectedReason instanceof PaymentOverpayError ||
      rejectedReason instanceof OptimisticLockConflictError ||
      rejectedReason instanceof OrderNotOnCreditError,
    ).toBe(true);

    const updatedOrder = await orderRepository.findById(EntityId.of(orderId));
    const paymentSum = await paymentRepository.sumAmountByOrderId(orderId);
    const payments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
    });

    expect(updatedOrder).not.toBeNull();
    expect(updatedOrder!.getStatus()).toBe(OrderStatus.PAID);
    expect(updatedOrder!.getOutstandingAmount().isZero()).toBe(true);
    expect(updatedOrder!.getVersion()).toBe(1);

    expect(paymentSum).toBe(50_000);
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      orderId,
      amount: 50_000,
      method,
    });
    expect(payments[0].paidAt.toISOString()).toBe(paidAt.toISOString());
  });
});