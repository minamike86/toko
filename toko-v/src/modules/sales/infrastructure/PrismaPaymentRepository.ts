import { PrismaClient, Prisma } from "@prisma/client";
import { PaymentRepository } from "../domain/PaymentRepository";
import { Payment } from "../domain/Payment";

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaClient) { }

  private getClient(tx?: unknown): PrismaClient | Prisma.TransactionClient {
    return (tx as Prisma.TransactionClient) ?? this.prisma;
  }

  async save(payment: Payment, tx?: unknown): Promise<void> {
    const client = this.getClient(tx);

    await client.payment.create({
      data: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        paidAt: payment.paidAt,
        method: payment.method,
        createdAt: payment.createdAt,
      },
    });
  }

  async sumAmountByOrderId(orderId: string, tx?: unknown): Promise<number> {
    const client = this.getClient(tx);

    const result = await client.payment.aggregate({
      where: { orderId },
      _sum: { amount: true },
    });

    return result._sum.amount ?? 0;
  }
}