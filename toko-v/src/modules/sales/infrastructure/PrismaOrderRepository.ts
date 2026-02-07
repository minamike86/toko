import { PrismaClient } from "@prisma/client";
import { OrderRepository } from "../domain/OrderRepository";
import { Order } from "../domain/Order";
import { OrderItem } from "../domain/OrderItem";
import { OrderStatus } from "../domain/OrderStatus";
import { OrderType } from "../domain/OrderType";

import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { PositiveInt } from "@/shared/value-objects/PositiveInt";

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(order: Order): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: order.id.toString() },
        create: {
          id: order.id.toString(),
          type: order.type,
          status: order.getStatus(),
          totalAmount: order.getTotalAmount().get(),
          outstandingAmount: order.getOutstandingAmount().get(),
          createdAt: order.createdAt,
          createdBy: order.createdBy.toString(),
          items: {
            create: order.items.map((it) => ({
              id: it.id.toString(),
              productId: it.productId.toString(),
              productNameSnapshot: it.productNameSnapshot,
              unitSnapshot: it.unitSnapshot,
              unitPriceSnapshot: it.unitPriceSnapshot.get(),
              quantity: it.quantity.get(),
              subtotal: it.subtotal.get(),
            })),
          },
        },
        update: {
          status: order.getStatus(),
          outstandingAmount: order.getOutstandingAmount().get(),
        },
      });
    });
  }

  async findById(id: EntityId): Promise<Order | null> {
  const data = await this.prisma.order.findUnique({
    where: { id: id.toString() },
    include: { items: true },
  });

  if (!data) return null;

  const items = data.items.map((row) =>
    OrderItem.create({
      id: EntityId.of(row.id),
      productId: EntityId.of(row.productId),
      productNameSnapshot: row.productNameSnapshot,
      unitSnapshot: row.unitSnapshot,
      unitPriceSnapshot: Money.of(row.unitPriceSnapshot),
      quantity: PositiveInt.of(row.quantity),
    })
  );

  const order = Order.reconstitute({
    id: EntityId.of(data.id),
    type: data.type as OrderType,
    status: data.status as OrderStatus,
    items,
    totalAmount: Money.of(data.totalAmount),
    outstandingAmount: Money.of(data.outstandingAmount),
    createdAt: data.createdAt,
    createdBy: EntityId.of(data.createdBy),
  });

  return order;
}


}
