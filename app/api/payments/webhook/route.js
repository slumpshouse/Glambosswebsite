import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getStripeClient } from "@/src/lib/stripe";

export const runtime = "nodejs";

export async function POST(request) {
  const stripe = getStripeClient();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  const payload = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("[payments/webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const alreadyHandled = await prisma.paymentWebhookEvent.findUnique({
    where: { eventId: event.id },
  });

  if (alreadyHandled) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const saleId = Number(paymentIntent.metadata?.saleId);
    const saleIds = String(paymentIntent.metadata?.saleIds ?? "")
      .split(",")
      .map((value) => Number(value))
      .filter((id) => Number.isInteger(id) && id > 0);

    const paymentState = {
      paymentStatus: event.type === "payment_intent.succeeded" ? "paid" : "failed",
      paidAt: event.type === "payment_intent.succeeded" ? new Date() : null,
    };

    if (saleIds.length > 0) {
      await prisma.sale.updateMany({
        where: { id: { in: saleIds } },
        data: paymentState,
      });
    }

    if (Number.isInteger(saleId) && saleId > 0) {
      await prisma.sale.updateMany({
        where: { id: saleId },
        data: paymentState,
      });
    }
  }

  await prisma.paymentWebhookEvent.create({
    data: {
      eventId: event.id,
      eventType: event.type,
    },
  });

  return NextResponse.json({ received: true });
}
