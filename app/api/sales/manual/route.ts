import { getToken } from "next-auth/jwt";
import { executeManualSale } from "@/src/lib/sale-transaction";
import { createManualSaleSchema } from "@/src/lib/manual-sale-validation";

export async function POST(request: Request) {
  const token = await getToken({
    req: request as never,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createManualSaleSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await executeManualSale({
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      customerPhone: parsed.data.customerPhone,
      customerName: parsed.data.customerName,
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create manual sale";

    if (message === "Product not found") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (message === "Requested quantity cannot exceed current stock") {
      return Response.json({ error: message }, { status: 400 });
    }

    return Response.json({ error: "Failed to create manual sale" }, { status: 500 });
  }
}
