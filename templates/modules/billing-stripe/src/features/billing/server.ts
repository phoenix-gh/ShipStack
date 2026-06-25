import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

import {
  billingCustomer,
  billingSubscription,
  stripeEvent,
} from "~/db/billing-schema";
import { auth } from "~/features/auth/server";

import * as billingSchema from "~/db/billing-schema";

const db = drizzle(env.DB, { schema: billingSchema });
const activeStatuses = new Set(["active", "trialing"]);

export interface BillingStatus {
  active: boolean;
  status: string | null;
  priceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export async function createCheckoutSession(headers: Headers) {
  const session = await requireBillingSession(headers);
  const customer = await getOrCreateCustomer(
    session.user.id,
    session.user.email,
  );
  const response = await stripeRequest("/v1/checkout/sessions", {
    mode: "subscription",
    customer: customer.stripeCustomerId,
    "line_items[0][price]": env.STRIPE_PRICE_ID,
    "line_items[0][quantity]": "1",
    success_url: env.BILLING_SUCCESS_URL,
    cancel_url: env.BILLING_CANCEL_URL,
    client_reference_id: session.user.id,
    "subscription_data[metadata][user_id]": session.user.id,
  });

  if (!isRecord(response) || typeof response.url !== "string") {
    throw new BillingError(
      "checkout_failed",
      "Stripe did not return a checkout URL.",
      502,
    );
  }

  return { url: response.url };
}

export async function createPortalSession(headers: Headers) {
  const session = await requireBillingSession(headers);
  const customer = await getCustomerByUserId(session.user.id);

  if (!customer) {
    throw new BillingError(
      "missing_customer",
      "Create a checkout session before opening the billing portal.",
      409,
    );
  }

  const response = await stripeRequest("/v1/billing_portal/sessions", {
    customer: customer.stripeCustomerId,
    return_url: env.BILLING_PORTAL_RETURN_URL,
  });

  if (!isRecord(response) || typeof response.url !== "string") {
    throw new BillingError(
      "portal_failed",
      "Stripe did not return a portal URL.",
      502,
    );
  }

  return { url: response.url };
}

export async function getBillingStatus(
  headers: Headers,
): Promise<BillingStatus> {
  const session = await requireBillingSession(headers);
  return await getBillingStatusForUser(session.user.id);
}

export async function hasActiveSubscription(headers: Headers) {
  const status = await getBillingStatus(headers);
  return status.active;
}

export async function handleStripeWebhook(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!(await verifyStripeSignature(payload, signature))) {
    throw new BillingError(
      "invalid_signature",
      "Invalid Stripe signature.",
      400,
    );
  }

  const event = JSON.parse(payload) as StripeEventPayload;
  const inserted = await insertStripeEvent(event);

  if (!inserted) {
    return { received: true, duplicate: true };
  }

  await processStripeEvent(event);
  return { received: true, duplicate: false };
}

export class BillingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function requireBillingSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id || !session.user.email) {
    throw new BillingError("unauthorized", "Authentication is required.", 401);
  }

  return session;
}

async function getCustomerByUserId(userId: string) {
  const [customer] = await db
    .select()
    .from(billingCustomer)
    .where(eq(billingCustomer.userId, userId))
    .limit(1);

  return customer ?? null;
}

async function getOrCreateCustomer(userId: string, email: string) {
  const existing = await getCustomerByUserId(userId);
  if (existing) {
    return existing;
  }

  const response = await stripeRequest("/v1/customers", {
    email,
    "metadata[user_id]": userId,
  });

  if (!isRecord(response) || typeof response.id !== "string") {
    throw new BillingError(
      "customer_failed",
      "Stripe did not return a customer id.",
      502,
    );
  }

  const customer = {
    id: crypto.randomUUID(),
    userId,
    stripeCustomerId: response.id,
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(billingCustomer).values(customer).onConflictDoNothing();
  return (await getCustomerByUserId(userId)) ?? customer;
}

async function getBillingStatusForUser(userId: string): Promise<BillingStatus> {
  const [subscription] = await db
    .select()
    .from(billingSubscription)
    .where(eq(billingSubscription.userId, userId))
    .orderBy(desc(billingSubscription.updatedAt))
    .limit(1);

  if (!subscription) {
    return {
      active: false,
      status: null,
      priceId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  return {
    active: activeStatuses.has(subscription.status),
    status: subscription.status,
    priceId: subscription.priceId,
    currentPeriodEnd:
      subscription.currentPeriodEnd?.toISOString?.() ??
      (subscription.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd).toISOString()
        : null),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}

async function insertStripeEvent(event: StripeEventPayload) {
  const result = await db
    .insert(stripeEvent)
    .values({
      id: event.id,
      type: event.type,
      createdAt: new Date(event.created * 1000),
      processedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning({ id: stripeEvent.id });

  return result.length > 0;
}

async function processStripeEvent(event: StripeEventPayload) {
  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data.object);
    return;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await upsertSubscription(event.data.object);
  }
}

async function handleCheckoutCompleted(object: StripeObject) {
  const userId =
    getString(object.metadata?.user_id) ??
    getString(object.client_reference_id);
  const customerId = getString(object.customer);
  const subscriptionId = getString(object.subscription);

  if (!userId || !customerId) {
    return;
  }

  await upsertCustomer({
    userId,
    stripeCustomerId: customerId,
    email: getString(object.customer_details?.email),
  });

  if (subscriptionId) {
    await upsertSubscription({
      id: subscriptionId,
      customer: customerId,
      status: "active",
      metadata: { user_id: userId },
    });
  }
}

async function upsertCustomer(input: {
  userId: string;
  stripeCustomerId: string;
  email?: string | null;
}) {
  const now = new Date();
  await db
    .insert(billingCustomer)
    .values({
      id: crypto.randomUUID(),
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      email: input.email ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: billingCustomer.stripeCustomerId,
      set: {
        userId: input.userId,
        email: input.email ?? null,
        updatedAt: now,
      },
    });
}

async function upsertSubscription(object: StripeObject) {
  const subscriptionId = getString(object.id);
  const customerId = getString(object.customer);
  const status = getString(object.status);

  if (!subscriptionId || !customerId || !status) {
    return;
  }

  const userId =
    getString(object.metadata?.user_id) ??
    (await findUserIdByCustomer(customerId));

  if (!userId) {
    return;
  }

  await upsertCustomer({
    userId,
    stripeCustomerId: customerId,
    email: null,
  });

  const now = new Date();
  await db
    .insert(billingSubscription)
    .values({
      id: crypto.randomUUID(),
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status,
      priceId: getSubscriptionPriceId(object),
      currentPeriodEnd: getTimestamp(object.current_period_end),
      cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: billingSubscription.stripeSubscriptionId,
      set: {
        userId,
        stripeCustomerId: customerId,
        status,
        priceId: getSubscriptionPriceId(object),
        currentPeriodEnd: getTimestamp(object.current_period_end),
        cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
        updatedAt: now,
      },
    });
}

async function findUserIdByCustomer(customerId: string) {
  const [customer] = await db
    .select()
    .from(billingCustomer)
    .where(eq(billingCustomer.stripeCustomerId, customerId))
    .limit(1);

  return customer?.userId ?? null;
}

function getSubscriptionPriceId(object: StripeObject) {
  const firstItem = object.items?.data?.[0];
  return getString(firstItem?.price?.id) ?? getString(object.plan?.id);
}

async function stripeRequest(path: string, params: Record<string, string>) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    body: new URLSearchParams(params),
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const body = await response.json();

  if (!response.ok) {
    const message = isRecord(body)
      ? (getString(body.error?.message) ?? "Stripe request failed.")
      : "Stripe request failed.";
    throw new BillingError("stripe_request_failed", message, 502);
  }

  return body;
}

async function verifyStripeSignature(payload: string, header: string | null) {
  if (!header) {
    return false;
  }

  const timestamp = header
    .split(",")
    .find((part) => part.startsWith("t="))
    ?.slice(2);
  const expectedSignature = header
    .split(",")
    .find((part) => part.startsWith("v1="))
    ?.slice(3);

  if (!timestamp || !expectedSignature) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const actualSignature = bytesToHex(new Uint8Array(signature));

  return timingSafeEqual(actualSignature, expectedSignature);
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function getTimestamp(value: unknown) {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function getString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface StripeEventPayload {
  id: string;
  type: string;
  created: number;
  data: {
    object: StripeObject;
  };
}

interface StripeObject {
  id?: unknown;
  customer?: unknown;
  subscription?: unknown;
  status?: unknown;
  client_reference_id?: unknown;
  current_period_end?: unknown;
  cancel_at_period_end?: unknown;
  metadata?: Record<string, unknown>;
  customer_details?: Record<string, unknown>;
  items?: {
    data?: Array<{
      price?: {
        id?: unknown;
      };
    }>;
  };
  plan?: {
    id?: unknown;
  };
}
