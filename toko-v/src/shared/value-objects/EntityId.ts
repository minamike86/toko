import { DomainError } from "@/shared/errors/DomainError";

export class EntityId {
  private constructor(private readonly value: string) {}

  static of(value: string): EntityId {
    const trimmed = value?.trim();
    if (!trimmed) throw new DomainError("ID tidak boleh kosong.");
    return new EntityId(trimmed);
  }

  toString(): string {
    return this.value;
  }
}
