import { PaymentRepository } from '@/modules/sales/domain/PaymentRepository';
import { Payment } from '@/modules/sales/domain/Payment';

/**
 * Infrastructure adapter: in-memory payment repository.
 *
 * Digunakan untuk:
 * - unit / application test
 * - local execution tanpa database
 *
 * Tidak mengandung logic bisnis apa pun.
 */
export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly payments: Payment[] = [];

  async save(payment: Payment, _tx?: unknown): Promise<void> {
    this.payments.push(payment);
  }

  async sumAmountByOrderId(orderId: string, _tx?: unknown): Promise<number> {
    let total = 0;

    for (const payment of this.payments) {
      if (payment.orderId === orderId) {
        total += payment.amount;
      }
    }

    return total;
  }
}
