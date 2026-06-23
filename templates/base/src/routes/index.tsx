import { createFileRoute } from "@tanstack/react-router";

import { ActionLink } from "~/components/ui/action-link";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <section className="page">
      <div className="eyebrow">Cloudflare-first SaaS starter</div>
      <h1>Build the product, not the same setup again.</h1>
      <p>
        ShipStack gives you a small TanStack Start foundation with Cloudflare
        Workers deployment, API route conventions, and a path toward database,
        auth, billing, and storage modules.
      </p>
      <div className="actions">
        <ActionLink href="/dashboard">Open dashboard</ActionLink>
        <ActionLink href="/health">Check app health</ActionLink>
      </div>
    </section>
  );
}
