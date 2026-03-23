import { Prisma, PrismaClient } from "@prisma/client";

import { TransactionRunner } from "@/modules/sales/application/ports/TransactionRunner";

export class PrismaTransactionRunner implements TransactionRunner {
  constructor(private readonly prisma: PrismaClient) { }

  async runInTransaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return work(tx);
    });
  }
}