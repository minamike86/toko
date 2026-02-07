import { PrismaClient } from "@prisma/client";

/* ======================
   SALES
   ====================== */

import { CreateOrder } from "@/modules/sales/application/CreateOrder";
import { CancelOrder } from "@/modules/sales/application/CancelOrder";

import { PrismaOrderRepository } from "@/modules/sales/infrastructure/PrismaOrderRepository";

/* ======================
   INVENTORY
   ====================== */

import { IssueStock } from "@/modules/inventory/application/IssueStock";
import { ReceiveStock } from "@/modules/inventory/application/ReceiveStock";

import { PrismaInventoryRepository } from "@/modules/inventory/infrastructure/PrismaInventoryRepository";
import { InventoryServiceAdapter } from "@/modules/inventory/infrastructure/InventoryServiceAdapter";

/* ======================
   CATALOG (READ ONLY)
   ====================== */

import { InMemoryCatalogReadRepository } from "@/modules/catalog/infrastructure/InMemoryCatalogReadRepository";

/* ======================
   PRISMA CLIENT
   ====================== */

const prisma = new PrismaClient();

/* ======================
   REPOSITORIES
   ====================== */

// Sales
export const orderRepo = new PrismaOrderRepository(prisma);

// Inventory
export const inventoryRepo = new PrismaInventoryRepository(prisma);

/* ======================
   INVENTORY USE CASES
   ====================== */

// OUT (SALE / RESERVE)
const issueStock = new IssueStock(inventoryRepo);

// IN (CANCEL / RETURN)
const receiveStock = new ReceiveStock(inventoryRepo);

/* ======================
   INVENTORY SERVICE (PORT ADAPTER)
   ====================== */

export const inventoryService = new InventoryServiceAdapter(
  issueStock,
  receiveStock
);

/* ======================
   CATALOG REPO (TEMP / MVP)
   ====================== */

export const catalogReadRepo = new InMemoryCatalogReadRepository([
  {
    productId: "P001",
    name: "Produk A",
    unit: "pcs",
    price: 10000,
    isActive: true,
  },
  {
    productId: "P002",
    name: "Produk B",
    unit: "pcs",
    price: 20000,
    isActive: true,
  },
]);

/* ======================
   SALES USE CASES
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
