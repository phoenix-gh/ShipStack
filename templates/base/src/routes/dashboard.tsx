import { createFileRoute } from "@tanstack/react-router";

import { InfoPanel } from "~/components/ui/info-panel";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <section className="page">
      <div className="eyebrow">Dashboard</div>
      <h1>Ready for modules.</h1>
      <p>
        This base dashboard is intentionally small. The auth module will add
        protected route guards, account settings, and session-aware data.
      </p>
      <div className="panel-grid">
        <InfoPanel label="Database">D1 + Drizzle module</InfoPanel>
        <InfoPanel label="Auth">Better Auth module</InfoPanel>
        <InfoPanel label="API">Versioned routes</InfoPanel>
      </div>
    </section>
  );
}
