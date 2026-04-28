import { Payment } from './Payment';

export interface PaymentRepository {
  save(payment: Payment, tx?: unknown): Promise<void>;
  sumAmountByOrderId(orderId: string, tx?: unknown): Promise<number>;
}
