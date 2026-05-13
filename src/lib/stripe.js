import Stripe from "stripe";

let stripeClient;

function getSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return key;
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getSecretKey(), {
      apiVersion: "2025-04-30.basil",
    });
  }

  return stripeClient;
}

export function toMinorUnitAmount(amount) {
  const minor = Math.round(Number(amount) * 100);

  if (!Number.isFinite(minor) || minor <= 0) {
    throw new Error("Sale total must be greater than zero");
  }

  return minor;
}
