import { Link, createFileRoute } from "@tanstack/react-router";

import { authClient } from "~/features/auth/client";
import { requireRouteSession } from "~/features/auth/route-guards";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireRouteSession,
  component: DashboardPage,
});

function DashboardPage() {
  const session = authClient.useSession();

  if (session.isPending) {
    return (
      <section className="page">
        <div className="eyebrow">Dashboard</div>
        <h1>Loading dashboard.</h1>
      </section>
    );
  }

  if (!session.data) {
    return (
      <section className="page">
        <div className="eyebrow">Dashboard</div>
        <h1>Sign in required.</h1>
        <p>The auth module is installed. Sign in to access your dashboard.</p>
        <div className="actions">
          <Link to="/sign-in">Sign in</Link>
          <Link to="/sign-up">Create account</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="eyebrow">Dashboard</div>
      <h1>Welcome, {session.data.user.name}.</h1>
      <p>Your session is active and ready for product features.</p>
      <div className="panel-grid">
        <div className="panel">
          <span>Email</span>
          <strong>{session.data.user.email}</strong>
        </div>
        <div className="panel">
          <span>Session</span>
          <strong>Authenticated</strong>
        </div>
        <div className="panel">
          <span>Account</span>
          <strong>
            <Link to="/account">Manage</Link>
          </strong>
        </div>
      </div>
    </section>
  );
}
