"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CancelPurchaseOrderButtonProps = {
  purchaseOrderId: string;
  status: string;
};

type CancelPurchaseOrderApiSuccess = {
  data: {
    purchaseOrderId: string;
    status: string;
    canceledAt: string;
    canceledBy: string;
  };
};

type CancelPurchaseOrderApiError = {
  error: {
    code: string;
    message: string;
  };
};

export function CancelPurchaseOrderButton(
  props: CancelPurchaseOrderButtonProps,
) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (props.status !== "CREATED") {
    return null;
  }

  async function handleCancel(): Promise<void> {
    const confirmed = window.confirm(
      "Batalkan purchase order ini?",
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/procurement/purchase-orders/${props.purchaseOrderId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorPayload =
          (await response.json()) as CancelPurchaseOrderApiError;

        setErrorMessage(errorPayload.error.message);
        return;
      }

      await response.json() as CancelPurchaseOrderApiSuccess;

      router.refresh();
    } catch {
      setErrorMessage("Gagal menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isSubmitting}
        className="rounded border border-red-600 px-3 py-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Membatalkan..." : "Batalkan Purchase Order"}
      </button>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}