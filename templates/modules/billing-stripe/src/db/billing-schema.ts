import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth-schema";

export const billingCustomer = sqliteTable(
  "billing_customer",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    email: text("email"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("billing_customer_user_id_idx").on(table.userId),
    uniqueIndex("billing_customer_stripe_customer_id_idx").on(
      table.stripeCustomerId,
    ),
  ],
);

export const billingSubscription = sqliteTable(
  "billing_subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    status: text("status").notNull(),
    priceId: text("price_id"),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("billing_subscription_user_id_idx").on(table.userId),
    uniqueIndex("billing_subscription_stripe_subscription_id_idx").on(
      table.stripeSubscriptionId,
    ),
  ],
);

export const stripeEvent = sqliteTable("stripe_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  processedAt: integer("processed_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const billingCustomerRelations = relations(
  billingCustomer,
  ({ one, many }) => ({
    user: one(user, {
      fields: [billingCustomer.userId],
      references: [user.id],
    }),
    subscriptions: many(billingSubscription),
  }),
);

export const billingSubscriptionRelations = relations(
  billingSubscription,
  ({ one }) => ({
    user: one(user, {
      fields: [billingSubscription.userId],
      references: [user.id],
    }),
    customer: one(billingCustomer, {
      fields: [billingSubscription.stripeCustomerId],
      references: [billingCustomer.stripeCustomerId],
    }),
  }),
);
