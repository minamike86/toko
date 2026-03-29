import { prisma } from "@/shared/prisma";

type SalesSummarySeedCase = {
  orderType: "OFFLINE" | "ONLINE";
  amount: number;
  paidAt: Date;
  createdAt?: Date;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureProductVariant(productId: string, variantId: string, price: number) {
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
      basePrice: price,
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
      basePrice: price,
      isActive: true,
    },
  });
}

export async function seedSalesSummaryScenario(
  cases: SalesSummarySeedCase[]
): Promise<void> {
  for (const c of cases) {
    const orderId = uid("ORDER");
    const itemId = uid("ITEM");
    const paymentId = uid("PAY");
    const productId = uid("P");
    const variantId = uid("V");

    const timestamp = c.paidAt ?? c.createdAt;

    if (!timestamp) {
      throw new Error("seedSalesSummaryScenario requires paidAt or createdAt");
    }

    await ensureProductVariant(productId, variantId, c.amount);

    await prisma.order.create({
      data: {
        id: orderId,
        type: c.orderType,
        status: "PAID",
        totalAmount: c.amount,
        outstandingAmount: 0,
        createdAt: timestamp,
        createdBy: "test-user",
        version: 0,
        items: {
          create: {
            id: itemId,
            productId,
            variantId,
            productNameSnapshot: "Test Product",
            unitSnapshot: "pcs",
            unitPriceSnapshot: c.amount,
            quantity: 1,
            subtotal: c.amount,
          },
        },
        payments: {
          create: {
            id: paymentId,
            amount: c.amount,
            paidAt: timestamp,
            method: "LEGACY",
            createdAt: timestamp,
          },
        },
      },
    });
  }
}