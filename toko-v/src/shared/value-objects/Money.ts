import { DomainError } from "@/shared/errors/DomainError";

export class Money {
  private constructor(private readonly amount: number) {}

  static of(amount: number): Money {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new DomainError("Money amount tidak valid.");
    }
    // MVP: pakai number, asumsi integer rupiah. Kalau nanti butuh decimal, ADR dulu.
    return new Money(Math.trunc(amount));
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return Money.of(this.amount + other.amount);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  get(): number {
    return this.amount;
  }
}
