import { createFileRoute } from "@tanstack/react-router";

import { InfoPanel } from "~/components/ui/info-panel";

export const Route = createFileRoute("/health")({
  component: HealthPage,
});

function HealthPage() {
  return (
    <section className="page">
      <div className="eyebrow">Health</div>
      <h1>System health is ok.</h1>
      <p>
        This page is a lightweight browser check for the generated app. Use the
        API health route for operational probes and uptime checks.
      </p>
      <div className="panel-grid">
        <InfoPanel label="App route">ok</InfoPanel>
        <InfoPanel label="API probe">
          <a href="/api/health">/api/health</a>
        </InfoPanel>
      </div>
    </section>
  );
}
