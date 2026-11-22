"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { apiRequest } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SchoolApplication = {
  id: string;
  schoolName: string;
  administratorEmail: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  school?: { slug: string; schoolCode: string } | null;
};

export function SchoolApplicationForm() {
  const [supabase] = useState(getSupabaseBrowserClient);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"sign-up" | "sign-in">("sign-up");
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [location, setLocation] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [application, setApplication] = useState<SchoolApplication | null>(null);
  const [email, setEmail] = useState("");
  const [administratorEmail, setAdministratorEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        setAuthLoading(false);
        return;
      }
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setError("");
      setMessage("");
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      }
      if (!nextSession) {
        setApplication(null);
        setAdministratorEmail(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session) return;

    let active = true;
    void apiRequest<SchoolApplication | null>("/school-applications/mine", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    })
      .then((record) => {
        if (active) setApplication(record);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Could not load your application.");
        }
      });

    return () => {
      active = false;
    };
  }, [session]);

  async function handleAuthentication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (authMode === "sign-up") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/schools/new` },
        });
        if (authError) throw authError;
        if (!data.session) {
          setMessage("Check your email to verify your account, then return here to continue.");
        } else {
          setSession(data.session);
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        setSession(data.session);
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordRecoveryRequest() {
    if (!supabase) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/schools/new`,
      });
      if (recoveryError) throw recoveryError;
      setMessage("If an account exists for this address, a password recovery link was sent.");
    } catch (recoveryError) {
      setError(
        recoveryError instanceof Error
          ? recoveryError.message
          : "Could not request a password recovery link.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setPasswordRecovery(false);
      setNewPassword("");
      setMessage("Your password has been updated.");
      window.history.replaceState({}, "", window.location.pathname);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update your password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleApplicationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const submitted = await apiRequest<SchoolApplication>("/school-applications", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          schoolName,
          location,
          schoolType,
          administratorEmail: administratorEmail ?? session.user.email ?? "",
        }),
      });
      setApplication(submitted);
      setMessage("Your application has been submitted for platform review.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not submit the application.");
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

  return (
    <div className="onboarding-layout">
      <div className="onboarding-form-card">
        <div className="onboarding-steps" aria-label="Onboarding progress">
          <span className="onboarding-step-active"><i>1</i> School details</span>
          <span><i>2</i> Verify & invite</span>
          <span><i>3</i> Set up academics</span>
        </div>

        {!supabase ? (
          <div className="onboarding-confirmation">
            <p className="eyebrow">Authentication setup required</p>
            <h2>School applications are not configured yet.</h2>
            <p>
              Add the public Supabase URL and anon key to the web environment before
              creating an account or submitting an application.
            </p>
          </div>
        ) : authLoading ? (
          <div className="onboarding-confirmation" role="status">
            <p className="eyebrow">Checking account</p>
            <h2>Loading your secure session…</h2>
          </div>
        ) : passwordRecovery ? (
          <div className="onboarding-confirmation">
            <p className="eyebrow">Secure your account</p>
            <h2>Choose a new password.</h2>
            <form className="onboarding-form" onSubmit={handlePasswordUpdate}>
              <label>
                New password
                <input
                  autoComplete="new-password"
                  minLength={8}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  type="password"
                  value={newPassword}
                />
              </label>
              {error ? <div className="onboarding-message onboarding-error" role="alert">{error}</div> : null}
              <button className="button button-dark onboarding-submit" disabled={busy} type="submit">
                {busy ? "Updating…" : "Update password"}
              </button>
            </form>
          </div>
        ) : session && application ? (
          <div className="onboarding-confirmation" role="status">
            <span className="confirmation-icon">
              {application.status === "REJECTED" ? "!" : "✓"}
            </span>
            {message ? <div className="onboarding-message onboarding-success">{message}</div> : null}
            <p className="eyebrow">School application</p>
            <h2>
              {application.status === "PENDING_REVIEW"
                ? "Your application is in review."
                : application.status === "APPROVED"
                  ? "Your school has been approved."
                  : "Your application needs an update."}
            </h2>
            <p>
              {application.status === "PENDING_REVIEW"
                ? "The SmartSchools team will review your school details. Approval starts onboarding and sends an invitation to the first school administrator."
                : application.status === "APPROVED"
                  ? application.administratorEmail.toLowerCase() === session?.user.email?.toLowerCase()
                    ? "Your verified account is the first school administrator. The school remains private until the platform activates it."
                    : `The platform team will coordinate the first administrator invitation for ${application.administratorEmail}. The school remains private until setup is complete and the platform activates it.`
                  : application.rejectionReason || "Contact the SmartSchools team if you need more information."}
            </p>
            <div className="preview-record">
              <span>School</span><strong>{application.schoolName}</strong>
              <span>Application ID</span><strong>{application.id}</strong>
              {application.school ? (
                <>
                  <span>School code</span><strong>{application.school.schoolCode}</strong>
                </>
              ) : null}
            </div>
            {application.school &&
            application.status === "APPROVED" &&
            application.administratorEmail.toLowerCase() === session?.user.email?.toLowerCase() ? (
              <Link
                className="button button-dark"
                href={`/s/${application.school.slug}/workspace/school-admin`}
              >
                Open school admin workspace
              </Link>
            ) : null}
            <button
              className="button button-dark"
              onClick={() => void handleSignOut()}
              type="button"
            >
              Sign out
            </button>
          </div>
        ) : session ? (
          <form className="onboarding-form" onSubmit={handleApplicationSubmit}>
            <p className="eyebrow">Start with the basics</p>
            <h2>Tell us about your school.</h2>
            <p className="onboarding-intro">
              Signed in as <strong>{session.user.email}</strong>. Your verified account
              will be the contact for this application.
            </p>
            <label>
              School name
              <input
                autoComplete="organization"
                onChange={(event) => setSchoolName(event.target.value)}
                placeholder="e.g. Greenfield Academy"
                maxLength={160}
                required
                value={schoolName}
              />
            </label>
            <div className="onboarding-field-row">
              <label>
                City or town
                <input
                  autoComplete="address-level2"
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g. Ikeja, Lagos"
                  maxLength={160}
                  required
                  value={location}
                />
              </label>
              <label>
                School type
                <select
                  onChange={(event) => setSchoolType(event.target.value)}
                  required
                  value={schoolType}
                >
                  <option value="">Select type</option>
                  <option>Primary school</option>
                  <option>Secondary school</option>
                  <option>K–12 school</option>
                  <option>School group</option>
                </select>
              </label>
            </div>
            <label>
              First school administrator email
              <input
                autoComplete="email"
                maxLength={254}
                onChange={(event) => setAdministratorEmail(event.target.value)}
                required
                type="email"
                value={administratorEmail ?? session.user.email ?? ""}
              />
            </label>
            {error ? <div className="onboarding-message onboarding-error" role="alert">{error}</div> : null}
            <button className="button button-dark onboarding-submit" disabled={busy} type="submit">
              {busy ? "Submitting…" : "Submit school application"} <span aria-hidden="true">→</span>
            </button>
            <button
              className="onboarding-back onboarding-signout"
              onClick={() => void handleSignOut()}
              type="button"
            >
              Sign out
            </button>
          </form>
        ) : (
          <form className="onboarding-form" onSubmit={handleAuthentication}>
            <p className="eyebrow">{authMode === "sign-up" ? "Create an account" : "Welcome back"}</p>
            <h2>{authMode === "sign-up" ? "Start with a verified account." : "Sign in to continue."}</h2>
            <p className="onboarding-intro">
              Applications are tied to a verified account. The first school administrator
              is invited only after platform review.
            </p>
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
                autoComplete={authMode === "sign-up" ? "new-password" : "current-password"}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            {error ? <div className="onboarding-message onboarding-error" role="alert">{error}</div> : null}
            {message ? <div className="onboarding-message onboarding-success" role="status">{message}</div> : null}
            <button className="button button-dark onboarding-submit" disabled={busy} type="submit">
              {busy ? "Please wait…" : authMode === "sign-up" ? "Create account" : "Sign in"}
              <span aria-hidden="true">→</span>
            </button>
            {authMode === "sign-in" ? (
              <button
                className="onboarding-back onboarding-auth-switch"
                disabled={busy}
                onClick={() => void handlePasswordRecoveryRequest()}
                type="button"
              >
                {busy ? "Sending recovery link…" : "Forgot your password?"}
              </button>
            ) : null}
            <button
              className="onboarding-back onboarding-auth-switch"
              onClick={() => {
                setAuthMode(authMode === "sign-up" ? "sign-in" : "sign-up");
                setError("");
                setMessage("");
              }}
              type="button"
            >
              {authMode === "sign-up" ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </form>
        )}
      </div>

      <aside className="onboarding-aside">
        <span className="onboarding-aside-mark" aria-hidden="true">✳</span>
        <p className="eyebrow">A guided start</p>
        <h2>One school.<br />A foundation<br />that fits.</h2>
        <p>
          Each school gets its own identity, structure and access. Your team brings the
          right people in as setup progresses.
        </p>
        <ul>
          <li><span>01</span> Submit a verified application</li>
          <li><span>02</span> Review and provision the school</li>
          <li><span>03</span> Invite the first administrator</li>
          <li><span>04</span> Welcome teachers and families</li>
        </ul>
      </aside>
    </div>
  );
}
