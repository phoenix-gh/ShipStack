import { Link, createFileRoute } from "@tanstack/react-router";

import { AuthForm } from "~/features/auth/components/auth-form";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <section className="page auth-page">
      <div className="eyebrow">Welcome back</div>
      <h1>Sign in.</h1>
      <p>Use your email and password to continue to your dashboard.</p>
      <AuthForm mode="sign-in" />
      <p className="muted-link">
        Need an account? <Link to="/sign-up">Create one</Link>
      </p>
    </section>
  );
}
