export interface TransactionRunner {
  runInTransaction<T>(work: (tx: unknown) => Promise<T>): Promise<T>;
}