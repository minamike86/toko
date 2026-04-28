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

/* ========================
   PROCUREMENT - PAYABLE
   ======================== */
import { DefaultStep7AuthorizationGuard } from "@/modules/procurement/application/payable/Step7AuthorizationGuard";
import type { Step7UnitOfWork } from "@/modules/procurement/application/payable/Step7UnitOfWork";
import { RecordSupplierPayment } from "@/modules/procurement/application/payable/RecordSupplierPayment";
import { GetSupplierOutstanding } from "@/modules/procurement/application/payable/GetSupplierOutstanding";
import { HandlePurchaseReturn } from "@/modules/procurement/application/payable/HandlePurchaseReturn";
import { PrismaPurchaseOrderPayableReader } from "@/modules/procurement/infrastructure/payable/PrismaPurchaseOrderPayableReader";
import { PrismaPurchaseReturnRepository } from "@/modules/procurement/infrastructure/payable/PrismaPurchaseReturnRepository";
import { PrismaSupplierPayableQuery } from "@/modules/procurement/infrastructure/payable/PrismaSupplierPayableQuery";
import { PrismaSupplierPayableReader } from "@/modules/procurement/infrastructure/payable/PrismaSupplierPayableReader";
import { PrismaSupplierPaymentRepository } from "@/modules/procurement/infrastructure/payable/PrismaSupplierPaymentRepository";

/* ======================
   CATALOG (READ ONLY)
   ====================== */

import { ListPosVariants } from "@/modules/catalog/application/ListPosVariants";
import { PrismaCatalogReadRepository } from "@/modules/catalog/infrastructure/PrismaCatalogReadRepository";

/* ======================
   PRISMA CLIENT
   ====================== */

const prisma = new PrismaClient();

/* ========================
   PROCUREMENT - PAYABLE
   ======================== */

class ImmediateStep7UnitOfWork implements Step7UnitOfWork {
   async runInTransaction<T>(operation: () => Promise<T>): Promise<T> {
      return operation();
   }
}

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

// PROCUREMENT - PAYABLE
export const purchaseOrderPayableReader =
   new PrismaPurchaseOrderPayableReader(prisma);

export const supplierPayableReader =
   new PrismaSupplierPayableReader(prisma);

export const supplierPaymentRepo =
   new PrismaSupplierPaymentRepository(prisma);

export const purchaseReturnRepo =
   new PrismaPurchaseReturnRepository(prisma);

export const supplierPayableQuery =
   new PrismaSupplierPayableQuery(prisma);

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

// PROCUREMENT - PAYABLE

const step7Authorization = new DefaultStep7AuthorizationGuard();
const step7UnitOfWork = new ImmediateStep7UnitOfWork();

const step7Context = {
   now: () => new Date(),
};

export const recordSupplierPayment = new RecordSupplierPayment({
   authorization: step7Authorization,
   unitOfWork: step7UnitOfWork,
   purchaseOrders: purchaseOrderPayableReader,
   suppliers: supplierPayableReader,
   payments: supplierPaymentRepo,
   returns: purchaseReturnRepo,
   context: step7Context,
});

export const getSupplierOutstanding = new GetSupplierOutstanding({
   authorization: step7Authorization,
   suppliers: supplierPayableReader,
   payableQuery: supplierPayableQuery,
});

export const handlePurchaseReturn = new HandlePurchaseReturn({
   authorization: step7Authorization,
   unitOfWork: step7UnitOfWork,
   purchaseOrders: purchaseOrderPayableReader,
   suppliers: supplierPayableReader,
   payments: supplierPaymentRepo,
   returns: purchaseReturnRepo,
   context: step7Context,
});

/* ======================
   SYSTEM / MAINTENANCE
   ====================== */

export const toggleMaintenance = new ToggleMaintenance(systemStateRepo);