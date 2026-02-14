import { describe, it, expect, beforeEach } from "vitest";

import { PayCredit } from "@/modules/sales/application/PayCredit";
import { Order } from "@/modules/sales/domain/Order";
import { OrderStatus } from "@/modules/sales/domain/OrderStatus";
import { OrderType } from "@/modules/sales/domain/OrderType";
import { EntityId } from "@/shared/value-objects/EntityId";
import { NotFoundError } from "@/shared/errors/ApplicationError";

import { InMemoryOrderRepository } from "@/modules/sales/infrastructure/InMemoryOrderRepository";
import { InMemoryPaymentRepository } from '@/modules/sales/infrastructure/InMemoryPaymentRepository';
import { createDummyOrderItem } from "./dummy/createDummyOrderItem";
import { createOrderWithTotal } from "./dummy/createOrderWithTotal";

const actor = {
  id: "user-1",
  role: "KASIR" as const,
};

describe("PayCredit Use Case", () => {
  let orderRepo: InMemoryOrderRepository;
  let paymentRepository: InMemoryPaymentRepository;
  let useCase: PayCredit;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    paymentRepository = new InMemoryPaymentRepository();
    useCase = new PayCredit(orderRepo,  paymentRepository);
  });

  it('marks order as PAID when order is ON_CREDIT and fully settled', async () => {
      const orderId = 'ORDER-1';

      const order = createOrderWithTotal({
        orderId,
        total: 10_000,
        createdBy: 'user-1',
      });

      order.markAsCredit();
      await orderRepo.save(order);

      await useCase.execute({
        orderId,
        amount: 10_000,
        occurredAt: new Date(),
        actor,
      });

      const updated = await orderRepo.findById(EntityId.of(orderId));

      expect(updated).toBeDefined();
      expect(updated!.getStatus()).toBe(OrderStatus.PAID);

  });

  it('throws error when order is not ON_CREDIT', async () => {
    const orderId = 'ORDER-2';

    const order = Order.create({
      id: EntityId.of(orderId),
      type: OrderType.OFFLINE,
      items: [createDummyOrderItem(orderId)],
      createdAt: new Date(),
      createdBy: EntityId.of('user-1'),
    });

    // status CREATED (belum markAsCredit)
    orderRepo.save(order);

    await expect(
      useCase.execute({
        orderId,
        amount: 10_000,          // tetap wajib
        occurredAt: new Date(),  // tetap wajib
        actor,
      }),
    ).rejects.toThrow();
  });

  it('throws error when order already PAID', async () => {
    const orderId = 'ORDER-3';

    const order = Order.create({
      id: EntityId.of(orderId),
      type: OrderType.OFFLINE,
      items: [createDummyOrderItem(orderId)],
      createdAt: new Date(),
      createdBy: EntityId.of('user-1'),
    });

    order.markAsPaid();
    orderRepo.seed(order);

    await expect(
      useCase.execute({
        orderId,
        amount: 10_000,          // tetap wajib
        occurredAt: new Date(),  // tetap wajib
        actor,
      }),
    ).rejects.toThrow();
  });

  it('throws error when order already CANCELED', async () => {
    const orderId = 'ORDER-4';

    const order = Order.create({
      id: EntityId.of(orderId),
      type: OrderType.OFFLINE,
      items: [createDummyOrderItem(orderId)],
      createdAt: new Date(),
      createdBy: EntityId.of('user-1'),
    });

    order.cancel();
    orderRepo.seed(order);

    await expect(
      useCase.execute({
        orderId,
        amount: 10_000,          // tetap wajib
        occurredAt: new Date(),  // tetap wajib
        actor,
      }),
    ).rejects.toThrow();
  });


 it('throws NotFoundError when order does not exist', async () => {
  await expect(
    useCase.execute({
      orderId: 'MISSING-ID',
      amount: 10_000,          // dummy, tapi wajib
      occurredAt: new Date(),  // dummy, tapi wajib
      actor,
    }),
  ).rejects.toBeInstanceOf(NotFoundError);
});


});

describe('PayCredit (Phase 1 – Payment Settlement)', () => {
 
    let orderRepository: InMemoryOrderRepository;
    let paymentRepository: InMemoryPaymentRepository;
    let payCredit: PayCredit;

    beforeEach(() => {
      orderRepository = new InMemoryOrderRepository();
      paymentRepository = new InMemoryPaymentRepository();
      payCredit = new PayCredit(orderRepository, paymentRepository);
    });

    it('records partial payment and keeps order ON_CREDIT', async () => {
    const orderId = 'order-1';

    const order = Order.create({
      id: EntityId.of(orderId),
      type: OrderType.OFFLINE,       
      items: [createDummyOrderItem(orderId)],
      createdAt: new Date(),
      createdBy: EntityId.of('user-1'),
    });

    order.markAsCredit();
    await orderRepository.save(order);

    await payCredit.execute({
      orderId,
      amount: 4_000, // 1 item x 10_000 → partial
      occurredAt: new Date(),
      actor,
    });

    const updated = await orderRepository.findById(EntityId.of(orderId));

    expect(updated).toBeDefined();
    expect(updated!.getStatus()).toBe(OrderStatus.ON_CREDIT);
    expect(updated!.getOutstandingAmount().get()).toBe(6_000);
  });

  it('marks order as PAID when fully settled', async () => {

    const orderId = 'order-2';

    const order = createOrderWithTotal({
      orderId,
      total: 50_000,
      createdBy: 'user-1',
    });

    order.markAsCredit();
    await orderRepository.save(order);

    await payCredit.execute({
      orderId,
      amount: 50_000,
      occurredAt: new Date(),
      actor,
    });

    const updatedOrder = await orderRepository.findById(EntityId.of(orderId));

    expect(updatedOrder).toBeDefined();
    expect(updatedOrder!.getStatus()).toBe(OrderStatus.PAID);
    expect(updatedOrder!.getOutstandingAmount().isZero()).toBe(true);
    

  });

 it('rejects overpayment', async () => {
    const orderId = 'order-3';

    const order = createOrderWithTotal({
      orderId,
      total: 30_000,
      createdBy: 'user-1',
    });

    order.markAsCredit();
    await orderRepository.save(order);

    await expect(
      payCredit.execute({
        orderId,
        amount: 40_000, // overpayment
        occurredAt: new Date(),
        actor,
      }),
    ).rejects.toThrow();
  });

});