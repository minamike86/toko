import { PrismaClient } from "@prisma/client";

/* ======================
   SYSTEM / MAINTENANCE
   ====================== */

import { PrismaSystemStateRepository } from "@/shared/system/PrismaSystemStateRepository";
import { ToggleMaintenance } from "@/shared/system/application/ToggleMaintenance";

/* ======================
   SALES
   ====================== */

import { CreateOrder } from "@/modules/sales/application/CreateOrder";
import { CancelOrder } from "@/modules/sales/application/CancelOrder";
import { PayCredit } from "@/modules/sales/application/PayCredit";
import { PrismaOrderRepository } from "@/modules/sales/infrastructure/PrismaOrderRepository";
import { PrismaPaymentRepository } from "@/modules/sales/infrastructure/PrismaPaymentRepository";
import { PrismaTransactionRunner } from "@/modules/sales/infrastructure/PrismaTransactionRunner";

/* ======================
   INVENTORY
   ====================== */

import { IssueStock } from "@/modules/inventory/application/IssueStock";
import { ReceiveStock } from "@/modules/inventory/application/ReceiveStock";
import { PrismaInventoryRepository } from "@/modules/inventory/infrastructure/PrismaInventoryRepository";
import { InventoryServiceAdapter } from "@/modules/inventory/infrastructure/InventoryServiceAdapter";

/* ======================
   PROCUREMENT
   ====================== */

import { CancelPurchaseOrder } from "@/modules/procurement/application/use-cases/CancelPurchaseOrder";
import { PrismaPurchaseOrderRepository } from "@/modules/procurement/infrastructure/prisma/PrismaPurchaseOrderRepository";

/* ======================
   CATALOG (READ ONLY)
   ====================== */

import { ListPosVariants } from "@/modules/catalog/application/ListPosVariants";
import { PrismaCatalogReadRepository } from "@/modules/catalog/infrastructure/PrismaCatalogReadRepository";

/* ======================
   PRISMA CLIENT
   ====================== */

const prisma = new PrismaClient();

/* ======================
   REPOSITORIES
   ====================== */

// Sales
export const orderRepo = new PrismaOrderRepository(prisma);
export const paymentRepo = new PrismaPaymentRepository(prisma);
export const transactionRunner = new PrismaTransactionRunner(prisma);

// Inventory
export const inventoryRepo = new PrismaInventoryRepository(prisma);

// Procurement
export const purchaseOrderRepo = new PrismaPurchaseOrderRepository(prisma);

// Catalog
export const catalogReadRepo = new PrismaCatalogReadRepository();

// System
export const systemStateRepo = new PrismaSystemStateRepository(prisma);

/* ======================
   INVENTORY USE CASES
   ====================== */

// OUT (SALE / RESERVE)
const issueStock = new IssueStock({ inventoryRepo });

// IN (CANCEL / RETURN)
const receiveStock = new ReceiveStock({ inventoryRepo });

/* ======================
   DEFAULT ACTOR FOR INTERNAL RETURN FLOW
   ====================== */

const defaultReturnActor = {
   actorId: "SYSTEM-CANCEL-ORDER",
   role: "ADMIN" as const,
};

/* ======================
   INVENTORY SERVICE (PORT ADAPTER)
   ====================== */

export const inventoryService = new InventoryServiceAdapter(
   issueStock,
   receiveStock,
   defaultReturnActor,
);

/* ======================
   CATALOG USE CASES
   ====================== */

export const listPosVariants = new ListPosVariants({
   catalogReadRepo,
});

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

export const payCredit = new PayCredit(
   orderRepo,
   paymentRepo,
   transactionRunner,
);

/* ======================
   PROCUREMENT USE CASES
   ====================== */

export const cancelPurchaseOrder = new CancelPurchaseOrder({
   purchaseOrderRepo,
});

/* ======================
   SYSTEM / MAINTENANCE
   ====================== */

export const toggleMaintenance = new ToggleMaintenance(systemStateRepo);