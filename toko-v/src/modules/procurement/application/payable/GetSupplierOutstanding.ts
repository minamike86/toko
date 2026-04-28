import type { SupplierPayableQuery } from "../../domain/payable/SupplierPayableQuery";
import type { SupplierPayableReader } from "../../domain/payable/SupplierPayableReader";
import {
  assertOutstandingNotNegative,
  calculateOutstanding,
} from "../../domain/payable/SupplierPayable";
import { Step7BusinessError } from "../../domain/payable/Step7Errors";
import type { Step7AuthorizationGuard } from "./Step7AuthorizationGuard";
import type {
  GetSupplierOutstandingInput,
  GetSupplierOutstandingResult,
  SupplierOutstandingPurchaseOrderDTO,
} from "./Step7DTO";

export type GetSupplierOutstandingDependencies = {
  authorization: Step7AuthorizationGuard;
  suppliers: SupplierPayableReader;
  payableQuery: SupplierPayableQuery;
};

export class GetSupplierOutstanding {
  constructor(
    private readonly dependencies: GetSupplierOutstandingDependencies,
  ) { }

  async execute(
    input: GetSupplierOutstandingInput,
  ): Promise<GetSupplierOutstandingResult> {
    this.dependencies.authorization.requireAdmin(input.actor);

    const supplier =
      await this.dependencies.suppliers.findPayableSnapshotById(
        input.supplierId,
      );

    if (supplier === null) {
      throw new Step7BusinessError(
        "SUPPLIER_NOT_FOUND",
        "Supplier was not found.",
      );
    }

    const summary =
      await this.dependencies.payableQuery.getOutstandingBySupplierId(
        input.supplierId,
      );

    if (summary === null) {
      return {
        supplierId: supplier.id,
        supplierStoreName: supplier.storeName,
        totalOutstanding: 0,
        purchaseOrders: [],
      };
    }

    const purchaseOrders: SupplierOutstandingPurchaseOrderDTO[] =
      summary.purchaseOrders.map((line) => {
        const derivedOutstanding = calculateOutstanding({
          payableInitial: line.payableInitial,
          totalPaid: line.totalPaid,
          totalReturned: line.totalReturned,
        });

        assertOutstandingNotNegative(derivedOutstanding);

        return {
          purchaseOrderId: line.purchaseOrderId,
          receivedAt: line.receivedAt,
          payableInitial: line.payableInitial,
          totalPaid: line.totalPaid,
          totalReturned: line.totalReturned,
          outstanding: derivedOutstanding,
        };
      });

    const totalOutstanding = purchaseOrders.reduce(
      (total, line) => total + line.outstanding,
      0,
    );

    return {
      supplierId: summary.supplierId,
      supplierStoreName: summary.supplierStoreName,
      totalOutstanding,
      purchaseOrders,
    };
  }
}