import { OrderRepository } from "@/modules/sales/domain/OrderRepository";
import { AuthorizationGuard } from "./guards/AuthorizationGuard";
import { EntityId } from "@/shared/value-objects/EntityId";
import { NotFoundError } from "@/shared/errors/ApplicationError";
import { OrderStatus } from "@/modules/sales/domain/OrderStatus";
import { Money } from '@/shared/value-objects/Money';

//===========================================================
import { PaymentRepository } from '@/modules/sales/domain/PaymentRepository';
import { Payment } from '@/modules/sales/domain/Payment';
import { randomUUID } from 'crypto';

const paymentId = EntityId.of(randomUUID());



/**
 * Actor context (application boundary)
 */
interface Actor {
  id: string;
  role: "ADMIN" | "KASIR";
}

/**
 * PayCredit Use Case
 *
 * Application rule:
 * - HANYA order dengan status ON_CREDIT yang boleh dibayar
 * - Rule ini adalah policy use case, BUKAN invariant domain
 */
export class PayCredit {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: PaymentRepository
  ) {}

  async execute(input: { 
    orderId: string; 
    amount: number;
    occurredAt: Date;
    actor: Actor;
   }): Promise<void> {
    const {  orderId, amount, occurredAt, actor } = input;

    /**
     * Authorization boundary
     */
    AuthorizationGuard.allowRoles(actor, ["ADMIN", "KASIR"]);

    /**
     * Load aggregate
     */
    const orderIdVO = EntityId.of(orderId);
    const order = await this.orderRepository.findById(orderIdVO);

    if (!order) {
      throw new NotFoundError("Order", orderIdVO.toString());
    }

    /**
     * APPLICATION POLICY (EXPLICIT)
     *
     * PayCredit hanya berlaku untuk order ON_CREDIT.
     * Status lain (CREATED, PAID, CANCELED) harus ditolak di sini,
     * bukan di domain.
     */
    if (order.getStatus() !== OrderStatus.ON_CREDIT) {
      throw new Error("Order is not on credit");
      /**
       * Sengaja generic:
       * - test hanya butuh reject
       * - tidak bocorkan detail domain
       * - sesuai error-handling-guidelines (application rule)
       */
    }

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    /**
     * Domain invariant check
     */
    const paymentAmount = Money.of(amount);

    if (paymentAmount.get() > order.getOutstandingAmount().get()) {
       throw new Error('Payment amount exceeds outstanding amount');
    }



     /**
     * Create payment fact
     */
    const payment = new Payment(
      EntityId.of(randomUUID()).toString(),
      orderIdVO.toString(),
      amount,
      occurredAt,
      new Date(),
    );

    /**
     * Persist payment
     */
    await this.paymentRepository.save(payment);

    /**
     * Recompute order state from facts
     */
   const totalPaidNumber =
    await this.paymentRepository.sumAmountByOrderId(orderIdVO.toString());

    const totalPaidMoney =
      totalPaidNumber === 0 ? Money.zero() : Money.of(totalPaidNumber);

    order.recomputeOutstanding(totalPaidMoney);



    /**
     * Persist state
     */
    await this.orderRepository.save(order);
  }
}
