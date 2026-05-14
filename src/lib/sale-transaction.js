import { prisma } from "./prisma";
import { assertQuantityWithinStock } from "./request-validation";
import { normalizePhone } from "./phone-normalization";

export async function executeSaleTransaction(tx, input) {
  const paymentStatus = input.paymentStatus ?? "pending";
  const normalizedPhone = normalizePhone(input.customerPhone);
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
    where: { phone: normalizedPhone },
    update: {
      name: input.customerName ?? undefined,
    },
    create: {
      phone: normalizedPhone,
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
      paymentStatus,
      currency: input.currency ?? "usd",
      paidAt: paymentStatus === "paid" ? new Date() : null,
    },
    select: {
      id: true,
      requestId: true,
      productId: true,
      customerId: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      paymentStatus: true,
      currency: true,
      paidAt: true,
    },
  });

  return { sale, customer };
}

export async function executeManualSale(input) {
  return prisma.$transaction(async (tx) => executeSaleTransaction(tx, input));
}
