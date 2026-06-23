import { Link, createFileRoute } from "@tanstack/react-router";

import { AuthForm } from "~/features/auth/components/auth-form";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <section className="page auth-page">
      <div className="eyebrow">Create account</div>
      <h1>Start building.</h1>
      <p>Create an account with email and password.</p>
      <AuthForm mode="sign-up" />
      <p className="muted-link">
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </section>
  );
}
