import { prisma } from "@/shared/prisma";

type CreditPaymentHistorySeedCase = {
  status: "PAID" | "ON_CREDIT";
  totalAmount: number;
  paidAmount?: number;
  createdAt: Date;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureProductVariant(productId: string, variantId: string) {
  await prisma.product.upsert({
    where: { id: productId },
    update: {
      name: "Test Product",
      isActive: true,
    },
    create: {
      id: productId,
      name: "Test Product",
      brand: null,
      isActive: true,
    },
  });

  await prisma.productVariant.upsert({
    where: { id: variantId },
    update: {
      productId,
      sku: `SKU-${variantId}`,
      variantName: "Default",
      unit: "pcs",
      basePrice: 10000,
      isActive: true,
    },
    create: {
      id: variantId,
      productId,
      sku: `SKU-${variantId}`,
      variantName: "Default",
      unit: "pcs",
      sizeLabel: null,
      colorLabel: null,
      basePrice: 10000,
      isActive: true,
    },
  });
}

export async function seedCreditPaymentHistoryScenario(
  cases: CreditPaymentHistorySeedCase[]
): Promise<void> {
  for (const c of cases) {
    const orderId = uid("ORDER");
    const itemId = uid("ITEM");
    const paymentId = uid("PAY");
    const productId = uid("P");
    const variantId = uid("V");

    const paidAmount = c.paidAmount ?? c.totalAmount;
    const outstandingAmount =
      c.status === "PAID" ? 0 : Math.max(c.totalAmount - paidAmount, 0);

    await ensureProductVariant(productId, variantId);

    await prisma.order.create({
      data: {
        id: orderId,
        type: "OFFLINE",
        status: c.status,
        totalAmount: c.totalAmount,
        outstandingAmount,
        createdAt: c.createdAt,
        createdBy: "test-user",
        version: 0,
        items: {
          create: {
            id: itemId,
            productId,
            variantId,
            productNameSnapshot: "Test Product",
            unitSnapshot: "pcs",
            unitPriceSnapshot: c.totalAmount,
            quantity: 1,
            subtotal: c.totalAmount,
          },
        },
        payments:
          paidAmount > 0
            ? {
              create: {
                id: paymentId,
                amount: paidAmount,
                paidAt: c.createdAt,
                method: "LEGACY",
                createdAt: c.createdAt,
              },
            }
            : undefined,
      },
    });
  }
}