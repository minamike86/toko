import { Order } from "@/modules/sales/domain/Order";
import { OrderRepository } from "@/modules/sales/domain/OrderRepository";
import { EntityId } from "@/shared/value-objects/EntityId";
import { OptimisticLockConflictError } from '../domain/SalesErrors';

export class InMemoryOrderRepository implements OrderRepository {
  private store = new Map<string, Order>();

  async findById(id: EntityId, _tx?: unknown): Promise<Order | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async save(order: Order): Promise<void> {
    this.store.set(order.id.toString(), order);
  }

  async saveWithVersionCheck(
    order: Order,
    expectedVersion: number,
    _tx?: unknown,

  ): Promise<void> {
    const existing = this.store.get(order.id.toString());
    const currentVersion = existing?.getVersion();
    // If no record exists or version mismatch, throw conflict.
    if (currentVersion === undefined || currentVersion !== expectedVersion) {
      throw new OptimisticLockConflictError();
    }
    // Increment the version on the passed-in entity and persist it.
    order._incrementVersion();
    this.store.set(order.id.toString(), order);
  }

  seed(order: Order): void {
    this.store.set(order.id.toString(), order);
  }
}
