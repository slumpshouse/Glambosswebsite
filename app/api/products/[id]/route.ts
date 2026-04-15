import { prisma } from "@/src/lib/prisma";
import { updateProductSchema } from "@/src/lib/product-validation";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(id: string): number | null {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function GET(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const parsedId = parseId(id);

  if (!parsedId) {
    return Response.json({ error: "Invalid product id" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsedId } });

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  return Response.json(product);
}

export async function PUT(request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const parsedId = parseId(id);

  if (!parsedId) {
    return Response.json({ error: "Invalid product id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findUnique({ where: { id: parsedId } });
    if (!existing) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id: parsedId },
      data: parsed.data,
    });

    return Response.json(updated);
  } catch {
    return Response.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const parsedId = parseId(id);

  if (!parsedId) {
    return Response.json({ error: "Invalid product id" }, { status: 400 });
  }

  try {
    await prisma.product.delete({ where: { id: parsedId } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
