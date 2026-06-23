import { createFileRoute } from "@tanstack/react-router";

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
        <div className="panel">
          <span>App route</span>
          <strong>ok</strong>
        </div>
        <div className="panel">
          <span>API probe</span>
          <strong>
            <a href="/api/health">/api/health</a>
          </strong>
        </div>
      </div>
    </section>
  );
}
