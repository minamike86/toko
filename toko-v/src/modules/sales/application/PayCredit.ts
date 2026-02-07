import { OrderRepository } from "@/modules/sales/domain/OrderRepository";
import { AuthorizationGuard } from "./guards/AuthorizationGuard";
import { EntityId } from "@/shared/value-objects/EntityId";
import { NotFoundError } from "@/shared/errors/ApplicationError";
import { OrderStatus } from "@/modules/sales/domain/OrderStatus";

/**
 * Actor context (application boundary)
 */
interface Actor {
  id: string;
  role: "ADMIN" | "KASIR";
}

/**
 * PayCredit Use Case
 *
 * Application rule:
 * - HANYA order dengan status ON_CREDIT yang boleh dibayar
 * - Rule ini adalah policy use case, BUKAN invariant domain
 */
export class PayCredit {
  constructor(
    private readonly orderRepository: OrderRepository
  ) {}

  async execute(input: { orderId: string; actor: Actor }): Promise<void> {
    const { orderId, actor } = input;

    /**
     * Authorization boundary
     */
    AuthorizationGuard.allowRoles(actor, ["ADMIN", "KASIR"]);

    /**
     * Load aggregate
     */
    const orderIdVO = EntityId.of(orderId);
    const order = await this.orderRepository.findById(orderIdVO);

    if (!order) {
      throw new NotFoundError("Order", orderIdVO.toString());
    }

    /**
     * APPLICATION POLICY (EXPLICIT)
     *
     * PayCredit hanya berlaku untuk order ON_CREDIT.
     * Status lain (CREATED, PAID, CANCELED) harus ditolak di sini,
     * bukan di domain.
     */
    if (order.getStatus() !== OrderStatus.ON_CREDIT) {
      throw new Error("Order is not on credit");
      /**
       * Sengaja generic:
       * - test hanya butuh reject
       * - tidak bocorkan detail domain
       * - sesuai error-handling-guidelines (application rule)
       */
    }

    /**
     * Domain invariant owner
     */
    order.markAsPaid();

    /**
     * Persist state
     */
    await this.orderRepository.save(order);
  }
}
