import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { assertQuantityWithinStock } from "./request-validation";

export type SaleTransactionInput = {
  productId: number;
  quantity: number;
  customerPhone: string;
  customerName?: string;
  requestId?: number;
};

export type SaleTransactionResult = {
  sale: {
    id: number;
    requestId: number | null;
    productId: number;
    customerId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };
  customer: {
    id: number;
    phone: string;
    name: string | null;
  };
};

export async function executeSaleTransaction(
  tx: Prisma.TransactionClient,
  input: SaleTransactionInput
): Promise<SaleTransactionResult> {
  const product = await tx.product.findUnique({
    where: { id: input.productId },
    select: {
      id: true,
      stock: true,
      cost: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // 1) Validate stock availability
  assertQuantityWithinStock(input.quantity, product.stock);

  // 4) Create or link customer by unique phone
  const customer = await tx.customer.upsert({
    where: { phone: input.customerPhone },
    update: {
      name: input.customerName ?? undefined,
    },
    create: {
      phone: input.customerPhone,
      name: input.customerName,
    },
    select: {
      id: true,
      phone: true,
      name: true,
    },
  });

  // 2) Reduce product stock
  await tx.product.update({
    where: { id: input.productId },
    data: {
      stock: {
        decrement: input.quantity,
      },
    },
  });

  // 3) Create sale record
  const sale = await tx.sale.create({
    data: {
      requestId: input.requestId,
      productId: input.productId,
      customerId: customer.id,
      quantity: input.quantity,
      unitPrice: product.cost ?? 0,
      totalPrice: (product.cost ?? 0) * input.quantity,
    },
    select: {
      id: true,
      requestId: true,
      productId: true,
      customerId: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
    },
  });

  return { sale, customer };
}

export async function executeManualSale(
  input: SaleTransactionInput
): Promise<SaleTransactionResult> {
  return prisma.$transaction(async (tx) => executeSaleTransaction(tx, input));
}
