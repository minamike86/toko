import { PrismaClient } from "@prisma/client";

import { DefaultStep7AuthorizationGuard } from "../../../application/payable/Step7AuthorizationGuard";
import type { Step7UnitOfWork } from "../../../application/payable/Step7UnitOfWork";
import { RecordSupplierPayment } from "../../../application/payable/RecordSupplierPayment";
import { GetSupplierOutstanding } from "../../../application/payable/GetSupplierOutstanding";
import { HandlePurchaseReturn } from "../../../application/payable/HandlePurchaseReturn";
import { PrismaPurchaseOrderPayableReader } from "../../../infrastructure/payable/PrismaPurchaseOrderPayableReader";
import { PrismaPurchaseReturnRepository } from "../../../infrastructure/payable/PrismaPurchaseReturnRepository";
import { PrismaSupplierPayableQuery } from "../../../infrastructure/payable/PrismaSupplierPayableQuery";
import { PrismaSupplierPayableReader } from "../../../infrastructure/payable/PrismaSupplierPayableReader";
import { PrismaSupplierPaymentRepository } from "../../../infrastructure/payable/PrismaSupplierPaymentRepository";

export class ImmediateStep7UnitOfWork implements Step7UnitOfWork {
  async runInTransaction<T>(operation: () => Promise<T>): Promise<T> {
    return operation();
  }
}

export function createPayableIntegrationUseCases(prisma: PrismaClient): {
  recordSupplierPayment: RecordSupplierPayment;
  getSupplierOutstanding: GetSupplierOutstanding;
  handlePurchaseReturn: HandlePurchaseReturn;
} {
  const authorization = new DefaultStep7AuthorizationGuard();
  const unitOfWork = new ImmediateStep7UnitOfWork();

  const purchaseOrders = new PrismaPurchaseOrderPayableReader(prisma);
  const suppliers = new PrismaSupplierPayableReader(prisma);
  const payments = new PrismaSupplierPaymentRepository(prisma);
  const returns = new PrismaPurchaseReturnRepository(prisma);
  const payableQuery = new PrismaSupplierPayableQuery(prisma);

  return {
    recordSupplierPayment: new RecordSupplierPayment({
      authorization,
      unitOfWork,
      purchaseOrders,
      suppliers,
      payments,
      returns,
      context: {
        now: () => new Date("2026-04-26T00:00:00.000Z"),
      },
    }),
    getSupplierOutstanding: new GetSupplierOutstanding({
      authorization,
      suppliers,
      payableQuery,
    }),
    handlePurchaseReturn: new HandlePurchaseReturn({
      authorization,
      unitOfWork,
      purchaseOrders,
      suppliers,
      payments,
      returns,
      context: {
        now: () => new Date("2026-04-26T00:00:00.000Z"),
      },
    }),
  };
}