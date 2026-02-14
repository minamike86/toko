import { Order } from '@/modules/sales/domain/Order';
import { OrderType } from '@/modules/sales/domain/OrderType';
import { EntityId } from '@/shared/value-objects/EntityId';
import { createDummyOrderItem } from './createDummyOrderItem';

/**
 * Helper test untuk membuat Order dengan total tertentu
 * TANPA melanggar kontrak domain.
 *
 * Asumsi:
 * - createDummyOrderItem menghasilkan item dengan harga 10.000
 */
export function createOrderWithTotal(params: {
  orderId: string;
  total: number;
  createdBy: string;
}): Order {
  const { orderId, total, createdBy } = params;

  const unitPrice = 10_000;

  if (total % unitPrice !== 0) {
    throw new Error(
      'createOrderWithTotal hanya mendukung total kelipatan 10.000',
    );
  }

  const itemCount = total / unitPrice;

  const items = Array.from({ length: itemCount }, () =>
    createDummyOrderItem(orderId),
  );

  return Order.create({
    id: EntityId.of(orderId),
    type: OrderType.OFFLINE,
    items,
    createdAt: new Date(),
    createdBy: EntityId.of(createdBy),
  });
}
