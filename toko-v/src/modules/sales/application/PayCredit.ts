import { randomUUID } from "crypto";

import { OrderRepository } from "../domain/OrderRepository";
import { PaymentRepository } from "../domain/PaymentRepository";
import { Payment } from "../domain/Payment";
import { OrderStatus } from "../domain/OrderStatus";
import {
  InvalidPaymentAmountError,
  PaymentOverpayError,
  OrderNotOnCreditError,
  OptimisticLockConflictError,
} from "../domain/SalesErrors";

import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { NotFoundError } from "@/shared/errors/ApplicationError";

import { AuthorizationGuard, Actor } from "./guards/AuthorizationGuard";
import { TransactionRunner } from "./ports/TransactionRunner";

export class PayCredit {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly transactionRunner: TransactionRunner,
  ) { }

  async execute(input: {
    orderId: string;
    amount: number;
    paidAt: Date;
    method: string;
    actor: Actor;
  }): Promise<void> {
    const { orderId, amount, paidAt, method, actor } = input;

    AuthorizationGuard.allowRoles(actor, ["ADMIN", "KASIR"]);

    if (amount <= 0) {
      throw new InvalidPaymentAmountError();
    }

    const orderIdVO = EntityId.of(orderId);

    let attempts = 0;
    while (attempts < 2) {
      attempts += 1;

      try {
        await this.transactionRunner.runInTransaction(async (tx) => {
          const order = await this.orderRepository.findById(orderIdVO, tx);
          if (!order) {
            throw new NotFoundError("Order", orderIdVO.toString());
          }

          if (order.getStatus() !== OrderStatus.ON_CREDIT) {
            throw new OrderNotOnCreditError();
          }

          const totalPaidBeforeNumber =
            await this.paymentRepository.sumAmountByOrderId(
              orderIdVO.toString(),
              tx,
            );

          const totalPaidBefore =
            totalPaidBeforeNumber === 0
              ? Money.zero()
              : Money.of(totalPaidBeforeNumber);

          const totalPaidAfterNumber = totalPaidBefore.get() + amount;

          if (totalPaidAfterNumber > order.getTotalAmount().get()) {
            throw new PaymentOverpayError();
          }

          const payment = new Payment(
            randomUUID(),
            orderIdVO.toString(),
            amount,
            paidAt,
            method,
            new Date(),
          );

          await this.paymentRepository.save(payment, tx);

          const totalPaidAfter =
            totalPaidAfterNumber === 0
              ? Money.zero()
              : Money.of(totalPaidAfterNumber);

          const expectedVersion = order.getVersion();

          order.recomputeOutstanding(totalPaidAfter);

          await this.orderRepository.saveWithVersionCheck(
            order,
            expectedVersion,
            tx,
          );
        });

        return;
      } catch (err) {
        if (err instanceof OptimisticLockConflictError) {
          if (attempts >= 2) {
            throw err;
          }
          continue;
        }

        throw err;
      }
    }
  }
}