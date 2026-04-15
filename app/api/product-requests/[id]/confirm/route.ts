import { getToken } from "next-auth/jwt";
import { confirmPendingRequest } from "@/src/lib/request-confirmation";

type ProductRequestConfirmRouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(id: string): number | null {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function PATCH(request: Request, context: ProductRequestConfirmRouteContext) {
  const token = await getToken({
    req: request as never,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const requestId = parseId(id);

  if (!requestId) {
    return Response.json({ error: "Invalid request id" }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      customerPhone?: string;
      customerName?: string;
    };

    if (!body.customerPhone || !body.customerPhone.trim()) {
      return Response.json({ error: "customerPhone is required" }, { status: 400 });
    }

    const result = await confirmPendingRequest({
      requestId,
      customerPhone: body.customerPhone.trim(),
      customerName: body.customerName?.trim() || undefined,
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Confirmation failed";

    if (message === "Request not found") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (message === "Only pending requests can be confirmed") {
      return Response.json({ error: message }, { status: 409 });
    }

    if (message === "Requested quantity cannot exceed current stock") {
      return Response.json({ error: message }, { status: 400 });
    }

    return Response.json({ error: "Failed to confirm request" }, { status: 500 });
  }
}
