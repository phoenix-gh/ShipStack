import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { authClient } from "~/features/auth/client";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const session = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
    await navigate({ to: "/sign-in" });
  }

  if (session.isPending) {
    return (
      <section className="page">
        <div className="eyebrow">Account</div>
        <h1>Loading account.</h1>
      </section>
    );
  }

  if (!session.data) {
    return (
      <section className="page">
        <div className="eyebrow">Account</div>
        <h1>Sign in required.</h1>
        <p>You need an active session to view account settings.</p>
        <div className="actions">
          <Link to="/sign-in">Sign in</Link>
          <Link to="/sign-up">Create account</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="eyebrow">Account</div>
      <h1>{session.data.user.name}</h1>
      <p>{session.data.user.email}</p>
      <div className="actions">
        <button onClick={signOut} type="button">
          Sign out
        </button>
      </div>
    </section>
  );
}

