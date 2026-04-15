"use client";

import { useEffect, useMemo, useState } from "react";

import {
  PosCatalogList,
  type PosVariantOption,
} from "./_components/PosCatalogList";
import {
  PosCart,
  type PosCartItem,
} from "./_components/PosCart";
import { PosSummary } from "./_components/PosSummary";
import { PosSubmitButton } from "./_components/PosSubmitButton";
import {
  PosTransactionList,
  type PosTransactionRow,
} from "./_components/PosTransactionList";

type CreateOrderResponse = {
  orderId: string;
  status: string;
  totalAmount: number;
  outstandingAmount: number;
};

const ACTOR_ID = "POS-OPERATOR-001";
const ACTOR_ROLE = "SALES" as const;

function generateOrderId(): string {
  return `ORD-${Date.now()}`;
}

export default function PosPage() {
  const [variants, setVariants] = useState<PosVariantOption[]>([]);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [payment, setPayment] = useState<"CASH" | "CREDIT">("CASH");
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CreateOrderResponse | null>(null);

  const [transactions, setTransactions] = useState<PosTransactionRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ON_CREDIT" | "PAID" | "CANCELED"
  >("ALL");
  const [isActing, setIsActing] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap(): Promise<void> {
      try {
        setErrorMessage(null);
        setIsLoadingCatalog(true);

        const [variantResponse, transactionResponse] = await Promise.all([
          fetch("/api/catalog/variants", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/orders?status=ALL", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        if (!variantResponse.ok) {
          throw new Error("Gagal memuat daftar variant.");
        }

        if (!transactionResponse.ok) {
          throw new Error("Gagal memuat transaksi.");
        }

        const variantData = (await variantResponse.json()) as PosVariantOption[];
        const transactionData =
          (await transactionResponse.json()) as PosTransactionRow[];

        if (!mounted) {
          return;
        }

        setVariants(variantData);
        setTransactions(transactionData);
      } catch (error: unknown) {
        if (!mounted) {
          return;
        }

        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Gagal memuat data POS.");
        }
      } finally {
        if (mounted) {
          setIsLoadingCatalog(false);
        }
      }
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  async function loadTransactions(
    filter: "ALL" | "ON_CREDIT" | "PAID" | "CANCELED",
  ): Promise<void> {
    const response = await fetch(`/api/orders?status=${filter}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Gagal memuat transaksi.");
    }

    const data = (await response.json()) as PosTransactionRow[];
    setTransactions(data);
  }

  function addToCart(variant: PosVariantOption): void {
    setCart((current) => {
      const existing = current.find(
        (item) => item.variantId === variant.variantId,
      );

      if (existing) {
        return current.map((item) =>
          item.variantId === variant.variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          variantId: variant.variantId,
          productId: variant.productId,
          productName: variant.productName,
          variantName: variant.variantName ?? "-",
          unit: variant.unit,
          price: variant.price,
          quantity: 1,
        },
      ];
    });
  }

  function increaseQuantity(variantId: string): void {
    setCart((current) =>
      current.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decreaseQuantity(variantId: string): void {
    setCart((current) =>
      current
        .map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(variantId: string): void {
    setCart((current) =>
      current.filter((item) => item.variantId !== variantId),
    );
  }

  const estimatedTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  async function submitOrder(): Promise<void> {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setResult(null);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: generateOrderId(),
          type: "OFFLINE",
          payment,
          items: cart.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          actorId: ACTOR_ID,
          role: ACTOR_ROLE,
        }),
      });

      const data = (await response.json()) as
        | CreateOrderResponse
        | {
          error: string;
          message: string;
        };

      if (!response.ok) {
        const errorResponse = data as { error: string; message: string };
        throw new Error(errorResponse.message || "Gagal membuat order.");
      }

      setResult(data as CreateOrderResponse);
      setCart([]);
      setPayment("CASH");
      await loadTransactions(statusFilter);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Gagal membuat order.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(orderId: string): Promise<void> {
    try {
      setIsActing(true);
      setErrorMessage(null);

      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });

      const data = (await response.json()) as
        | {
          error: string;
          message: string;
        }
        | {
          success?: boolean;
        };

      if (!response.ok) {
        const errorResponse = data as { error: string; message: string };
        throw new Error(errorResponse.message || "Gagal membatalkan order.");
      }

      await loadTransactions(statusFilter);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Gagal membatalkan order.");
      }
    } finally {
      setIsActing(false);
    }
  }

  async function handlePayCredit(orderId: string): Promise<void> {
    try {
      setIsActing(true);
      setErrorMessage(null);

      const response = await fetch(`/api/orders/${orderId}/pay-credit`, {
        method: "POST",
      });

      const data = (await response.json()) as
        | {
          error: string;
          message: string;
        }
        | {
          success?: boolean;
        };

      if (!response.ok) {
        const errorResponse = data as { error: string; message: string };
        throw new Error(errorResponse.message || "Gagal melunasi credit.");
      }

      await loadTransactions(statusFilter);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Gagal melunasi credit.");
      }
    } finally {
      setIsActing(false);
    }
  }

  async function applyFilter(
    filter: "ALL" | "ON_CREDIT" | "PAID" | "CANCELED",
  ): Promise<void> {
    try {
      setErrorMessage(null);
      setStatusFilter(filter);
      await loadTransactions(filter);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Gagal memuat transaksi.");
      }
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">POS</h1>
        <p className="mt-1 text-sm text-slate-600">
          Buat order penjualan cash atau credit.
        </p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {result ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div>Order berhasil dibuat.</div>
          <div>Order ID: {result.orderId}</div>
          <div>Status: {result.status}</div>
          <div>Total: {result.totalAmount}</div>
          <div>Outstanding: {result.outstandingAmount}</div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <PosCatalogList
            isLoading={isLoadingCatalog}
            variants={variants}
            onAdd={addToCart}
          />
        </section>

        <section className="space-y-4">
          <PosCart
            items={cart}
            onIncrease={increaseQuantity}
            onDecrease={decreaseQuantity}
            onRemove={removeItem}
          />

          <PosSummary
            payment={payment}
            totalItems={totalItems}
            estimatedTotal={estimatedTotal}
            onChangePayment={setPayment}
          />

          <PosSubmitButton
            disabled={cart.length === 0 || isSubmitting}
            isSubmitting={isSubmitting}
            onSubmit={submitOrder}
          />
        </section>
      </div>

      <section className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void applyFilter("ALL")}
            className="rounded border border-slate-300 px-3 py-1 text-sm"
          >
            ALL
          </button>
          <button
            type="button"
            onClick={() => void applyFilter("ON_CREDIT")}
            className="rounded border border-slate-300 px-3 py-1 text-sm"
          >
            ON_CREDIT
          </button>
          <button
            type="button"
            onClick={() => void applyFilter("PAID")}
            className="rounded border border-slate-300 px-3 py-1 text-sm"
          >
            PAID
          </button>
          <button
            type="button"
            onClick={() => void applyFilter("CANCELED")}
            className="rounded border border-slate-300 px-3 py-1 text-sm"
          >
            CANCELED
          </button>
        </div>

        <PosTransactionList
          rows={transactions}
          onCancel={handleCancel}
          onPayCredit={handlePayCredit}
          isActing={isActing}
        />
      </section>
    </main>
  );
}