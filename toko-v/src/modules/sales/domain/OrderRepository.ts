import { Order } from "./Order";
import { EntityId } from "@/shared/value-objects/EntityId";

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: EntityId): Promise<Order | null>;
}
