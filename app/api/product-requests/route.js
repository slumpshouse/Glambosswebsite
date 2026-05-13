import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminToken } from "@/src/lib/require-admin-token";
import {
  assertQuantityWithinStock,
  createRequestSchema,
} from "../../../src/lib/request-validation";
import { confirmPendingRequest } from "../../../src/lib/request-confirmation";

export async function GET(request) {
  const token = await requireAdminToken(request);
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pendingRequests = await prisma.request.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          stock: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return Response.json(pendingRequests);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = createRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true, stock: true },
    });

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    try {
      assertQuantityWithinStock(parsed.data.quantity, product.stock);
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Invalid quantity" },
        { status: 400 }
      );
    }

    let customerId = parsed.data.customerId;

    if (parsed.data.customerPhone) {
      const customer = await prisma.customer.upsert({
        where: { phone: parsed.data.customerPhone },
        update: {
          name: parsed.data.customerName ?? undefined,
        },
        create: {
          phone: parsed.data.customerPhone,
          name: parsed.data.customerName,
        },
        select: { id: true },
      });

      customerId = customer.id;
    }

    const created = await prisma.request.create({
      data: {
        productId: parsed.data.productId,
        quantity: parsed.data.quantity,
        status: "pending",
        customerId,
        notes: parsed.data.notes || undefined,
      },
      select: { id: true },
    });

    // Auto-confirm the request and create a Sale so the customer can pay immediately
    const { sale } = await confirmPendingRequest({
      requestId: created.id,
      customerPhone: parsed.data.customerPhone,
      customerName: parsed.data.customerName,
    });

    if (parsed.data.customerPhone) {
      const response = NextResponse.json({ saleId: sale.id }, { status: 201 });
      response.cookies.set("customer_phone", parsed.data.customerPhone, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    return Response.json({ saleId: sale.id }, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create request" }, { status: 500 });
  }
}
