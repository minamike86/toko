export interface Step7UnitOfWork {
  runInTransaction<T>(operation: () => Promise<T>): Promise<T>;
}