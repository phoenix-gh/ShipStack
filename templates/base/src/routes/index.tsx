import { createFileRoute } from "@tanstack/react-router";

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
        <a href="/dashboard">Open dashboard</a>
        <a href="/api/health">Check API health</a>
      </div>
    </section>
  );
}

