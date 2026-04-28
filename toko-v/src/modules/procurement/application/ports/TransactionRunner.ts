export interface TransactionContext {
  readonly transactionId: string;
}

export interface TransactionRunner {
  runInTransaction<T>(
    callback: (transaction: TransactionContext) => Promise<T>,
  ): Promise<T>;
}