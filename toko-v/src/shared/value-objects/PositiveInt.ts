import { DomainError } from "@/shared/errors/DomainError";
export class PositiveInt {
  private constructor(
    public readonly value: number
  ) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error("PositiveInt harus berupa bilangan bulat > 0");
    }
  }

  static from(value: number): PositiveInt {
    return new PositiveInt(value);
  }

  add(amount: number): PositiveInt {
    return new PositiveInt(this.value + amount);
  }

  subtract(amount: number): PositiveInt {
    const result = this.value - amount;
    if (result <= 0) {
      throw new Error("Hasil operasi menyebabkan nilai <= 0");
    }
    return new PositiveInt(result);
  }
 static of(value: number): PositiveInt {
    if (!Number.isInteger(value) || value <= 0) {
      throw new DomainError("Nilai harus bilangan bulat positif.");
    }
    return new PositiveInt(value);
  }

  get(): number {
    return this.value;
  }

}
