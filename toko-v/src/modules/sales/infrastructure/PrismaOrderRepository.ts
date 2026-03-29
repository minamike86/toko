import { PrismaClient, Prisma } from "@prisma/client";

import { OrderRepository } from "../domain/OrderRepository";
import { Order } from "../domain/Order";
import { OrderItem } from "../domain/OrderItem";
import { OrderStatus } from "../domain/OrderStatus";
import { OrderType } from "../domain/OrderType";
import { OptimisticLockConflictError } from "../domain/SalesErrors";

import { EntityId } from "@/shared/value-objects/EntityId";
import { Money } from "@/shared/value-objects/Money";
import { PositiveInt } from "@/shared/value-objects/PositiveInt";

type OrderWithItemsRow = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) { }

  private getClient(tx?: unknown): PrismaClient | Prisma.TransactionClient {
    return (tx as Prisma.TransactionClient | undefined) ?? this.prisma;
  }

  async save(order: Order): Promise<void> {
    await this.prisma.order.upsert({
      where: { id: order.id.toString() },
      create: {
        id: order.id.toString(),
        type: order.type,
        status: order.getStatus(),
        totalAmount: order.getTotalAmount().get(),
        outstandingAmount: order.getOutstandingAmount().get(),
        createdAt: order.createdAt,
        createdBy: order.createdBy.toString(),
        version: order.getVersion(),
        items: {
          create: order.items.map((item) => ({
            id: item.id.toString(),
            productId: item.productId.toString(),
            variantId: item.variantId.toString(),
            productNameSnapshot: item.productNameSnapshot,
            unitSnapshot: item.unitSnapshot,
            unitPriceSnapshot: item.unitPriceSnapshot.get(),
            quantity: item.quantity.get(),
            subtotal: item.subtotal.get(),
          })),
        },
      },
      update: {
        status: order.getStatus(),
        outstandingAmount: order.getOutstandingAmount().get(),
      },
    });
  }

  async findById(id: EntityId, tx?: unknown): Promise<Order | null> {
    const client = this.getClient(tx);

    const data = await client.order.findUnique({
      where: { id: id.toString() },
      include: { items: true },
    });

    if (!data) {
      return null;
    }

    return this.toDomain(data);
  }

  async saveWithVersionCheck(
    order: Order,
    expectedVersion: number,
    tx?: unknown,
  ): Promise<void> {
    const client = this.getClient(tx);

    try {
      const result = await client.order.updateMany({
        where: {
          id: order.id.toString(),
          version: expectedVersion,
        },
        data: {
          status: order.getStatus(),
          outstandingAmount: order.getOutstandingAmount().get(),
          version: {
            increment: 1,
          },
        },
      });

      if (result.count === 0) {
        throw new OptimisticLockConflictError();
      }

      order._incrementVersion();
    } catch (error) {
      if (this.isRetryableWriteConflict(error)) {
        throw new OptimisticLockConflictError();
      }

      throw error;
    }
  }

  private isRetryableWriteConflict(error: unknown): boolean {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2028")
    ) {
      return true;
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      const message = error.message.toLowerCase();
      return (
        message.includes("write conflict") ||
        message.includes("deadlock") ||
        message.includes("transaction failed")
      );
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("write conflict") ||
        message.includes("deadlock") ||
        message.includes("transaction failed")
      );
    }

    return false;
  }

  private toDomain(data: OrderWithItemsRow): Order {
    const items = data.items.map((row) => {
      if (!row.variantId) {
        throw new Error(
          `OrderItem.variantId kosong pada row ${row.id}. Phase B seharusnya sudah backfill.`,
        );
      }

      return OrderItem.create({
        id: EntityId.of(row.id),
        productId: EntityId.of(row.productId),
        variantId: EntityId.of(row.variantId),
        productNameSnapshot: row.productNameSnapshot,
        unitSnapshot: row.unitSnapshot,
        unitPriceSnapshot: Money.of(row.unitPriceSnapshot),
        quantity: PositiveInt.of(row.quantity),
      });
    });

    return Order.reconstitute({
      id: EntityId.of(data.id),
      type: data.type as OrderType,
      status: data.status as OrderStatus,
      items,
      totalAmount: Money.of(data.totalAmount),
      outstandingAmount: Money.of(data.outstandingAmount),
      createdAt: data.createdAt,
      createdBy: EntityId.of(data.createdBy),
      version: data.version,
    });
  }
}