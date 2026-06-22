import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "ShipStack App",
      },
      {
        name: "description",
        content: "A Cloudflare-first SaaS app generated with ShipStack.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootComponent() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          ShipStack
        </Link>
        <nav>
          <Link to="/" activeProps={{ className: "active" }}>
            Home
          </Link>
          <Link to="/dashboard" activeProps={{ className: "active" }}>
            Dashboard
          </Link>
          <Link to="/sign-in" activeProps={{ className: "active" }}>
            Sign in
          </Link>
          <Link to="/account" activeProps={{ className: "active" }}>
            Account
          </Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

