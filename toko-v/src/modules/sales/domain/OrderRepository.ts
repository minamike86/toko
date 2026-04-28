import { Order } from "./Order";
import { EntityId } from "@/shared/value-objects/EntityId";

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: EntityId, tx?: unknown): Promise<Order | null>;

  /**
   * Persists the provided order only if the current stored version
   * matches the expected version. The version should be incremented by
   * the implementation upon successful update. If no record is updated
   * (due to a version mismatch), the implementation MUST throw
   * OptimisticLockConflictError.
   */
  saveWithVersionCheck(order: Order, expectedVersion: number, tx?: unknown): Promise<void>;
}
