import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getCustomerPhoneFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get("customer_phone")?.value ?? null;
}

export async function requireCustomerSaleAccess(saleId) {
  const customerPhone = await getCustomerPhoneFromCookies();

  if (!customerPhone) {
    return { authorized: false, reason: "Customer phone cookie not found" };
  }

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: {
      id: true,
      totalPrice: true,
      currency: true,
      paymentStatus: true,
      stripePaymentIntentId: true,
      customer: {
        select: {
          id: true,
          phone: true,
          name: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!sale) {
    return { authorized: false, reason: "Sale not found" };
  }

  if (sale.customer.phone !== customerPhone) {
    return { authorized: false, reason: "Sale does not belong to this customer" };
  }

  return { authorized: true, sale };
}

export async function requireCustomerSalesAccess(saleIds) {
  const customerPhone = await getCustomerPhoneFromCookies();

  if (!customerPhone) {
    return { authorized: false, reason: "Customer phone cookie not found" };
  }

  const uniqueSaleIds = Array.from(
    new Set(
      (saleIds ?? []).filter((id) => Number.isInteger(id) && id > 0)
    )
  );

  if (uniqueSaleIds.length === 0) {
    return { authorized: false, reason: "No valid sales provided" };
  }

  const sales = await prisma.sale.findMany({
    where: {
      id: { in: uniqueSaleIds },
    },
    select: {
      id: true,
      totalPrice: true,
      currency: true,
      paymentStatus: true,
      stripePaymentIntentId: true,
      customer: {
        select: {
          id: true,
          phone: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      quantity: true,
      unitPrice: true,
    },
  });

  if (sales.length !== uniqueSaleIds.length) {
    return { authorized: false, reason: "One or more sales were not found" };
  }

  if (sales.some((sale) => sale.customer.phone !== customerPhone)) {
    return { authorized: false, reason: "Some sales do not belong to this customer" };
  }

  const orderedSales = uniqueSaleIds
    .map((id) => sales.find((sale) => sale.id === id))
    .filter(Boolean);

  return { authorized: true, sales: orderedSales };
}
