"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { apiRequest } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { School } from "@/lib/schools";
import type { WorkspaceId } from "@/lib/workspaces";

type Workspace = {
  id: WorkspaceId;
  label: string;
};

type MembershipAccess = {
  allowed: true;
  role: string;
  schoolStatus: "ONBOARDING" | "ACTIVE";
  activationRequired: boolean;
  newlyAccepted: boolean;
  school: Pick<School, "name" | "slug" | "location" | "schoolCode">;
};

type Props = {
  school: School | null;
  schoolSlug: string;
  workspace: Workspace;
};

export function WorkspaceSignIn({ school, schoolSlug, workspace }: Props) {
  const [supabase] = useState(getSupabaseBrowserClient);
  const [session, setSession] = useState<Session | null>(null);
  const [access, setAccess] = useState<MembershipAccess | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSet, setPasswordSet] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const verifiedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAccess(null);
      setError("");
      verifiedToken.current = null;
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session || verifiedToken.current === session.access_token) return;
    verifiedToken.current = session.access_token;
    let active = true;

    void apiRequest<MembershipAccess>(
      `/schools/${encodeURIComponent(schoolSlug)}/access/${workspace.id}`,
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    )
      .then((result) => {
        if (active) setAccess(result);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Could not verify school membership.");
        }
      });

    return () => {
      active = false;
    };
  }, [schoolSlug, session, workspace.id]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setBusy(true);
    setError("");
    setAccess(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) setError(signOutError.message);
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not sign out.");
    }
  }

  async function handleSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setBusy(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setPasswordSet(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not set your password.");
    } finally {
      setBusy(false);
    }
  }

  if (!supabase) {
    return (
      <div className="sign-in-access-card" role="alert">
        <span className="sign-in-access-icon">!</span>
        <div>
          <strong>Authentication is not configured.</strong>
          <p>The public Supabase URL and anon key must be set for this web app.</p>
        </div>
      </div>
    );
  }

  if (access) {
    return (
      <div className="sign-in-access-card" role="status">
        <span className="sign-in-access-icon">✓</span>
        <div>
          <strong>School membership verified.</strong>
          <p>
            {access.school.name} · {access.school.location} · School code {access.school.schoolCode}.{" "}
            {access.newlyAccepted && !passwordSet
              ? "Set a password to finish securing your administrator account."
              : access.activationRequired
                ? "Your administrator invitation is accepted. The school is still in onboarding and is not publicly active yet."
                : "Your account is authorized for this role. The operational workspace will be introduced in a later build phase."}
          </p>
          {access.newlyAccepted && !passwordSet ? (
            <form className="sign-in-password-form" onSubmit={handleSetPassword}>
              <label>
                Create a password
                <input
                  autoComplete="new-password"
                  minLength={8}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  type="password"
                  value={newPassword}
                />
              </label>
              {error ? <p className="sign-in-error" role="alert">{error}</p> : null}
              <button className="button button-dark" disabled={busy} type="submit">
                {busy ? "Saving…" : "Set password"}
              </button>
            </form>
          ) : null}
          {workspace.id === "school-admin" && (!access.newlyAccepted || passwordSet) ? (
            <div className="admin-access-actions">
              <Link className="button button-dark" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/dashboard`}>
                Open administrator dashboard <span aria-hidden="true">→</span>
              </Link>
              <Link className="admin-setup-shortcut" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/setup`}>
                Continue school setup
              </Link>
            </div>
          ) : null}
          <button className="sign-in-secondary-action" onClick={() => void handleSignOut()} type="button">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {authLoading ? (
        <div className="sign-in-access-card" role="status">
          <span className="sign-in-access-icon">…</span>
          <div><strong>Checking your account…</strong></div>
        </div>
      ) : session ? (
        <div className="sign-in-access-card" role={error ? "alert" : "status"}>
          <span className="sign-in-access-icon">{error ? "!" : "…"}</span>
          <div>
            <strong>{error ? "Access could not be verified." : "Verifying school membership…"}</strong>
            {error ? <p>{error}</p> : null}
            <button className="sign-in-secondary-action" onClick={() => void handleSignOut()} type="button">
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="sign-in-auth-context">
            Use your {school?.name ?? "school"} account. Your role is checked against its membership records.
          </p>
          <form className="sign-in-form" onSubmit={handleSignIn}>
            <label>
              Email address
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label>
              Password
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            {error ? <p className="sign-in-error" role="alert">{error}</p> : null}
            <button className="button button-dark" disabled={busy} type="submit">
              {busy ? "Verifying…" : "Sign in securely"} <span aria-hidden="true">→</span>
            </button>
          </form>
        </>
      )}
    </>
  );
}
