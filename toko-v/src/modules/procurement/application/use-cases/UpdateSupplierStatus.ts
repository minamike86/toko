import { SupplierRepository } from "@/modules/procurement/domain/SupplierRepository";
import { UpdateSupplierStatusInput } from "../dto/UpdateSupplierStatusInput";
import { SupplierDto } from "../dto/SupplierDto";
import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import {
  NotFoundError,
} from "@/shared/errors/ApplicationError";
import { ActorContext } from "@/shared/system/types/actor-context";
import { UserRole } from "@/modules/user/domain/UserRole";



export class UpdateSupplierStatus {
  constructor(private readonly supplierRepository: SupplierRepository) { }

  async execute(
    input: UpdateSupplierStatusInput,
    actor: ActorContext,
  ): Promise<SupplierDto> {
    AuthorizationGuard.assertAuthorized(actor, [UserRole.ADMIN]);

    const supplier = await this.supplierRepository.findById(input.supplierId);

    if (!supplier) {
      throw new NotFoundError("Supplier", input.supplierId);
    }

    if (input.isActive) {
      supplier.activate();
    } else {
      supplier.deactivate();
    }

    await this.supplierRepository.save(supplier);

    return {
      id: supplier.id,
      storeName: supplier.storeName,
      salesName: supplier.salesName,
      phone: supplier.phone,
      notes: supplier.notes,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
    };
  }
}