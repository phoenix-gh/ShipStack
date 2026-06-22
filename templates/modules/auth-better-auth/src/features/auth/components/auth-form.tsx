import { useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";

import { authClient } from "~/features/auth/client";

type AuthMode = "sign-in" | "sign-up";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "sign-up";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = isSignUp
      ? await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: "/dashboard",
        })
      : await authClient.signIn.email({
          email,
          password,
          callbackURL: "/dashboard",
        });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "Authentication failed");
      return;
    }

    await navigate({ to: "/dashboard" });
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {isSignUp ? (
        <label>
          Name
          <input
            autoComplete="name"
            name="name"
            onChange={(event) => setName(event.currentTarget.value)}
            required
            value={name}
          />
        </label>
      ) : null}
      <label>
        Email
        <input
          autoComplete="email"
          name="email"
          onChange={(event) => setEmail(event.currentTarget.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label>
        Password
        <input
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.currentTarget.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Working..." : isSignUp ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

