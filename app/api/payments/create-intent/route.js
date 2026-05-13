import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getStripeClient, toMinorUnitAmount } from "@/src/lib/stripe";
import {
  requireCustomerSaleAccess,
  requireCustomerSalesAccess,
} from "@/src/lib/payment-authorization";

function parseSaleIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const saleId = Number(body.saleId);
    const saleIds = parseSaleIds(body.saleIds);
    const primarySaleId = Number(body.primarySaleId);

    if (saleIds.length > 0) {
      const access = await requireCustomerSalesAccess(saleIds);

      if (!access.authorized) {
        return NextResponse.json({ error: access.reason }, { status: 403 });
      }

      const sales = access.sales;
      const unpaidSales = sales.filter((sale) => sale.paymentStatus !== "paid");

      if (unpaidSales.length === 0) {
        return NextResponse.json({
          saleIds: sales.map((sale) => sale.id),
          paymentStatus: "paid",
          alreadyPaid: true,
        });
      }

      const checkoutSale =
        unpaidSales.find((sale) => sale.id === primarySaleId) ?? unpaidSales[0];

      const stripe = getStripeClient();
      const amount = toMinorUnitAmount(
        unpaidSales.reduce((sum, current) => sum + Number(current.totalPrice || 0), 0)
      );

      let paymentIntent;

      if (checkoutSale.stripePaymentIntentId) {
        paymentIntent = await stripe.paymentIntents.retrieve(checkoutSale.stripePaymentIntentId);
      }

      const shouldCreateNewIntent =
        !paymentIntent ||
        ["succeeded", "canceled"].includes(paymentIntent.status);

      if (shouldCreateNewIntent) {
        paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: checkoutSale.currency,
          automatic_payment_methods: { enabled: true },
          metadata: {
            saleIds: unpaidSales.map((sale) => sale.id).join(","),
            primarySaleId: String(checkoutSale.id),
            customerId: String(checkoutSale.customer.id),
          },
        });

        await prisma.sale.update({
          where: { id: checkoutSale.id },
          data: { stripePaymentIntentId: paymentIntent.id },
        });
      } else if (paymentIntent.amount !== amount) {
        paymentIntent = await stripe.paymentIntents.update(paymentIntent.id, {
          amount,
          metadata: {
            saleIds: unpaidSales.map((sale) => sale.id).join(","),
            primarySaleId: String(checkoutSale.id),
            customerId: String(checkoutSale.customer.id),
          },
        });
      }

      return NextResponse.json({
        saleIds: unpaidSales.map((sale) => sale.id),
        primarySaleId: checkoutSale.id,
        clientSecret: paymentIntent.client_secret,
        paymentStatus: unpaidSales.every((sale) => sale.paymentStatus === "paid")
          ? "paid"
          : "pending",
      });
    }

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return NextResponse.json({ error: "Invalid sale id" }, { status: 400 });
    }

    const access = await requireCustomerSaleAccess(saleId);

    if (!access.authorized) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const sale = access.sale;
    const stripe = getStripeClient();
    const amount = toMinorUnitAmount(sale.totalPrice);

    if (sale.paymentStatus === "paid") {
      return NextResponse.json({
        saleId: sale.id,
        paymentStatus: sale.paymentStatus,
        alreadyPaid: true,
      });
    }

    let paymentIntent;

    if (sale.stripePaymentIntentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(sale.stripePaymentIntentId);
    }

    const shouldCreateNewIntent =
      !paymentIntent ||
      ["succeeded", "canceled"].includes(paymentIntent.status);

    if (shouldCreateNewIntent) {
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: sale.currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          saleId: String(sale.id),
          customerId: String(sale.customer.id),
        },
      });

      await prisma.sale.update({
        where: { id: sale.id },
        data: { stripePaymentIntentId: paymentIntent.id },
      });
    } else if (paymentIntent.amount !== amount) {
      paymentIntent = await stripe.paymentIntents.update(paymentIntent.id, {
        amount,
      });
    }

    return NextResponse.json({
      saleId: sale.id,
      clientSecret: paymentIntent.client_secret,
      paymentStatus: sale.paymentStatus,
    });
  } catch (error) {
    console.error("[payments/create-intent]", error);
    const message = error instanceof Error ? error.message : "Failed to create payment intent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
