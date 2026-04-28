import { TransactionRunner } from "@/modules/sales/application/ports/TransactionRunner";

export class FakeTransactionRunner implements TransactionRunner {
  async runInTransaction<T>(work: (tx: unknown) => Promise<T>): Promise<T> {
    return work(undefined);
  }
}