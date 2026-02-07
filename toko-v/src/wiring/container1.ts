import { CreateOrder } from "@/modules/sales/application/CreateOrder";
import { CancelOrder } from "@/modules/sales/application/CancelOrder";

import { IssueStock } from "@/modules/inventory/application/IssueStock";
import { AdjustStock } from "@/modules/inventory/application/AdjustStock";

import { InMemoryInventoryRepository } from "@/modules/inventory/infrastructure/InMemoryInventoryRepository";
import { InventoryServiceAdapter } from "@/modules/inventory/infrastructure/InventoryServiceAdapter";

import { InMemoryCatalogReadRepository } from "@/modules/catalog/infrastructure/InMemoryCatalogReadRepository";

import { OrderRepository } from "@/modules/sales/domain/OrderRepository";
import { Order } from "@/modules/sales/domain/Order";
import { EntityId } from "@/shared/value-objects/EntityId";

/* ======================
   Order Repository
   ====================== */

class InMemoryOrderRepository implements OrderRepository {
  private readonly store = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.store.set(order.id.toString(), order);
  }

  async findById(id: EntityId): Promise<Order | null> {
    return this.store.get(id.toString()) ?? null;
  }
}

export const orderRepo = new InMemoryOrderRepository();

/* ======================
   Catalog Repository
   ====================== */

export const catalogReadRepo =
  new InMemoryCatalogReadRepository([
    {
      productId: "P001",
      name: "Produk A",
      unit: "pcs",
      basePrice: 10000,
      isActive: true,
    },
    {
      productId: "P002",
      name: "Produk B",
      unit: "pcs",
      basePrice: 20000,
      isActive: true,
    },
  ]);

/* ======================
   Inventory Wiring
   ====================== */

const inventoryRepo = new InMemoryInventoryRepository([
  { productId: "P001", quantity: 100 },
  { productId: "P002", quantity: 50 },
]);

const issueStock = new IssueStock({ inventoryRepo });
const adjustStock = new AdjustStock({ inventoryRepo });

export const inventoryService = new InventoryServiceAdapter(
  issueStock,
  adjustStock
);

/* ======================
   Sales Use Cases
   ====================== */

export const createOrder = new CreateOrder({
  orderRepo,
  catalogReadRepo,
  inventoryService,
});

export const cancelOrder = new CancelOrder({
  orderRepo,
  inventoryService,
});
