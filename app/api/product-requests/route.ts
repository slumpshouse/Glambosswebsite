import { prisma } from "@/src/lib/prisma";
import {
  assertQuantityWithinStock,
  createRequestSchema,
} from "../../../src/lib/request-validation";

export async function GET() {
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
    },
  });

  return Response.json(pendingRequests);
}

export async function POST(request: Request) {
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

    const created = await prisma.request.create({
      data: {
        productId: parsed.data.productId,
        quantity: parsed.data.quantity,
        status: "pending",
        customerId: parsed.data.customerId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            stock: true,
          },
        },
      },
    });

    return Response.json(created, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create request" }, { status: 500 });
  }
}
