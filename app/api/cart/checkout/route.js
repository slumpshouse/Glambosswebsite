import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { assertQuantityWithinStock } from "@/src/lib/request-validation";
import { normalizePhone } from "@/src/lib/phone-normalization";

const cartCheckoutSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required").max(100),
  customerPhone: z.string().trim().min(5, "Customer phone is required").max(30),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "At least one item is required"),
});

function aggregateItems(items) {
  const map = new Map();

  for (const item of items) {
    const current = map.get(item.productId) ?? 0;
    map.set(item.productId, current + item.quantity);
  }

  return Array.from(map.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = cartCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const items = aggregateItems(parsed.data.items);
    const normalizedPhone = normalizePhone(parsed.data.customerPhone);

    const checkout = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { phone: normalizedPhone },
        update: { name: parsed.data.customerName },
        create: {
          phone: normalizedPhone,
          name: parsed.data.customerName,
        },
        select: { id: true },
      });

      const productIds = items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          stock: true,
          cost: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new Error("One or more products were not found");
      }

      const productById = new Map(products.map((product) => [product.id, product]));
      const saleIds = [];

      for (const item of items) {
        const product = productById.get(item.productId);

        if (!product) {
          throw new Error("Product not found");
        }

        assertQuantityWithinStock(item.quantity, product.stock);

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        const sale = await tx.sale.create({
          data: {
            productId: item.productId,
            customerId: customer.id,
            quantity: item.quantity,
            unitPrice: product.cost ?? 0,
            totalPrice: (product.cost ?? 0) * item.quantity,
            paymentStatus: "pending",
            currency: "usd",
          },
          select: { id: true },
        });

        saleIds.push(sale.id);
      }

      return { saleIds };
    });

    const response = NextResponse.json(
      {
        saleIds: checkout.saleIds,
        primarySaleId: checkout.saleIds[0],
      },
      { status: 201 }
    );

    response.cookies.set("customer_phone", normalizedPhone, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to checkout cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
