declare namespace Cloudflare {
  interface Env {
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    STRIPE_PRICE_ID: string;
    BILLING_SUCCESS_URL: string;
    BILLING_CANCEL_URL: string;
    BILLING_PORTAL_RETURN_URL: string;
  }
}
