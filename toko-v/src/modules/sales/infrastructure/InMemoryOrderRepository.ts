import { Order } from "@/modules/sales/domain/Order";
import { OrderRepository } from "@/modules/sales/domain/OrderRepository";
import { EntityId } from "@/shared/value-objects/EntityId";

export class InMemoryOrderRepository implements OrderRepository {
  private store = new Map<string, Order>();

  async findById(id: EntityId): Promise<Order | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async save(order: Order): Promise<void> {
    this.store.set(order.id.toString(), order);
  }

  seed(order: Order): void {
    this.store.set(order.id.toString(), order);
  }
}
