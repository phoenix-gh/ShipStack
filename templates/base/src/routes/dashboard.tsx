import { createFileRoute } from "@tanstack/react-router";

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
        <div className="panel">
          <span>Database</span>
          <strong>D1 + Drizzle module</strong>
        </div>
        <div className="panel">
          <span>Auth</span>
          <strong>Better Auth module</strong>
        </div>
        <div className="panel">
          <span>API</span>
          <strong>Versioned routes</strong>
        </div>
      </div>
    </section>
  );
}

