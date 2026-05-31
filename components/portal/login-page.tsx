"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PORTAL_STORAGE_KEY } from "@/lib/portal/client-store";
import { schoolInfo } from "@/lib/portal/mock-data";

function readPrototypeData() {
  try {
    const raw = window.localStorage.getItem(PORTAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function PortalLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("student1");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, clientData: readPrototypeData() }),
      });
      const data = (await response.json()) as {
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok || !data.redirectTo) {
        setError(data.message ?? "Unable to sign in.");
        return;
      }

      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Unable to reach the portal login service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-login-page">
      <section className="portal-login-shell">
        <div className="portal-login-intro">
          <Link href="/public-website" className="portal-login-logo">
            <span>{schoolInfo.name}</span>
          </Link>
          <h1>Private school portal</h1>
          <p>
            A clean management workspace for administration, teachers, parents,
            students, and the school psychologist.
          </p>
          <div className="portal-login-facts">
            <span>{schoolInfo.grades}</span>
            <span>{schoolInfo.tuition}</span>
            <span>Official Lebanese Ministry curriculum</span>
            <span>Entrance exam required for new students</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="portal-login-card">
          <p className="portal-kicker">Secure prototype login</p>
          <h2>Sign in</h2>
          <label>
            <span>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <div className="portal-error">{error}</div> : null}
          <button type="submit" className="portal-primary-button" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
          <Link href="/public-website" className="portal-public-link">
            Visit Public School Website
          </Link>
          <small>
            Demo only. Accounts use username/password and redirect by role.
          </small>
        </form>
      </section>
    </main>
  );
}
