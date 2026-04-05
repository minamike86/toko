import { Supplier } from "@/modules/procurement/domain/Supplier";
import { SupplierRepository } from "@/modules/procurement/domain/SupplierRepository";
import { CreateSupplierInput } from "../dto/CreateSupplierInput";
import { SupplierDto } from "../dto/SupplierDto";
import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import { ConflictError } from "@/shared/errors/ApplicationError";
import { ActorContext } from "@/shared/system/types/actor-context";

const PROCUREMENT_ALLOWED_ROLES = {
  ADMIN: "ADMIN",
} as const;

export class CreateSupplier {
  constructor(private readonly supplierRepository: SupplierRepository) { }

  async execute(
    input: CreateSupplierInput,
    actor: ActorContext,
  ): Promise<SupplierDto> {
    AuthorizationGuard.assertActorExists(actor);
    AuthorizationGuard.assertRole(actor, [PROCUREMENT_ALLOWED_ROLES.ADMIN]);

    const existingSupplier = await this.supplierRepository.findByStoreName(
      input.storeName,
    );

    if (existingSupplier) {
      throw new ConflictError("SUPPLIER_STORE_NAME_ALREADY_EXISTS");
    }

    const supplier = Supplier.create({
      id: this.supplierRepository.nextId(),
      storeName: input.storeName,
      salesName: input.salesName ?? null,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      createdAt: new Date(),
    });

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