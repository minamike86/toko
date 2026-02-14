import { Payment } from './Payment';

export interface PaymentRepository {
  save(payment: Payment): Promise<void>;
  sumAmountByOrderId(orderId: string): Promise<number>;
}
