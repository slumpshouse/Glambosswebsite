import { prisma } from "@/src/lib/prisma";
import { createProductSchema } from "@/src/lib/product-validation";
import { requireAdminToken } from "@/src/lib/require-admin-token";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "desc" },
    });
    return Response.json(products);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = await requireAdminToken(request);
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        cost: parsed.data.cost,
        stock: parsed.data.stock,
        imageUrl: parsed.data.imageUrl,
        description: parsed.data.description,
      },
    });

    return Response.json(product, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create product" }, { status: 500 });
  }
}
