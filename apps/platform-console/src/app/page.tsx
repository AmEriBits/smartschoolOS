"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { apiRequest } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Application = {
  id: string;
  schoolName: string;
  location: string;
  schoolType: string;
  contactEmail: string;
  administratorEmail: string;
  createdAt: string;
};

type School = {
  id: string;
  name: string;
  slug: string;
  schoolCode: string;
  location: string;
  status: "ONBOARDING" | "ACTIVE" | "SUSPENDED";
  discoverable: boolean;
  createdAt: string;
  memberships: { email: string; status: string }[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

export default function PlatformConsolePage() {
  const [supabase] = useState(getSupabaseBrowserClient);
  const [session, setSession] = useState<Session | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
      setError("");
      setNotice("");
      setLoading(Boolean(nextSession));
      if (!nextSession) {
        setApplications([]);
        setSchools([]);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchDashboard = useCallback(async (accessToken: string) => {
    const [nextApplications, nextSchools] = await Promise.all([
      apiRequest<Application[]>("/platform/school-applications", accessToken, {
        cache: "no-store",
      }),
      apiRequest<School[]>("/platform/schools", accessToken, {
        cache: "no-store",
      }),
    ]);
    return { applications: nextApplications, schools: nextSchools };
  }, []);

  useEffect(() => {
    if (!session) return;

    let active = true;
    void fetchDashboard(session.access_token)
      .then(({ applications: nextApplications, schools: nextSchools }) => {
        if (!active) return;
        setApplications(nextApplications);
        setSchools(nextSchools);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Could not load platform records.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchDashboard, session]);

  const loadDashboard = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError("");
    try {
      const { applications: nextApplications, schools: nextSchools } =
        await fetchDashboard(accessToken);
      setApplications(nextApplications);
      setSchools(nextSchools);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load platform records.");
    } finally {
      setLoading(false);
    }
  }, [fetchDashboard]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setBusyId("sign-in");
    setError("");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Sign-in failed.");
    } finally {
      setBusyId("");
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

  async function reviewApplication(application: Application, action: "approve" | "reject") {
    if (!session) return;
    const reason =
      action === "reject"
        ? window.prompt("Enter a reason to share with the applicant:")
        : undefined;
    if (action === "reject" && !reason?.trim()) return;

    setBusyId(application.id);
    setError("");
    setNotice("");
    let actionError = "";
    try {
      if (action === "approve") {
        const result = await apiRequest<{
          schoolCode: string;
          administratorEmail: string;
          invitationStatus: "INVITED" | "ALREADY_AUTHENTICATED";
        }>(
          `/platform/school-applications/${application.id}/approve`,
          session.access_token,
          { method: "POST" },
        );
        setNotice(
          result.invitationStatus === "INVITED"
            ? `School approved. Code ${result.schoolCode} was assigned and an invitation was sent to ${result.administratorEmail}.`
            : `School approved. Code ${result.schoolCode} was assigned; ${result.administratorEmail} is already the verified first administrator.`,
        );
      } else {
        await apiRequest(
          `/platform/school-applications/${application.id}/reject`,
          session.access_token,
          { method: "POST", body: JSON.stringify({ reason }) },
        );
        setNotice("The application was rejected and the reason was recorded.");
      }
    } catch (requestError) {
      actionError = requestError instanceof Error ? requestError.message : "Could not review this application.";
    } finally {
      await loadDashboard(session.access_token);
      if (actionError) setError(actionError);
      setBusyId("");
    }
  }

  async function retryInvitation(school: School) {
    if (!session) return;
    setBusyId(school.id);
    setError("");
    setNotice("");
    let actionError = "";
    try {
      await apiRequest(
        `/platform/schools/${school.id}/invite-admin`,
        session.access_token,
        { method: "POST" },
      );
      setNotice(`Administrator invitation sent for ${school.name}.`);
    } catch (requestError) {
      actionError = requestError instanceof Error ? requestError.message : "Could not send the administrator invitation.";
    } finally {
      await loadDashboard(session.access_token);
      if (actionError) setError(actionError);
      setBusyId("");
    }
  }

  async function activateSchool(school: School) {
    if (!session) return;
    setBusyId(school.id);
    setError("");
    setNotice("");
    let actionError = "";
    try {
      await apiRequest(
        `/platform/schools/${school.id}/activate`,
        session.access_token,
        { method: "POST" },
      );
      setNotice(`${school.name} is active and discoverable.`);
    } catch (requestError) {
      actionError = requestError instanceof Error ? requestError.message : "Could not activate this school.";
    } finally {
      await loadDashboard(session.access_token);
      if (actionError) setError(actionError);
      setBusyId("");
    }
  }

  const activeSchools = schools.filter((school) => school.status === "ACTIVE").length;
  const onboardingSchools = schools.filter((school) => school.status === "ONBOARDING").length;

  return (
    <main className="console-shell">
      <aside className="console-sidebar">
        <Link className="console-brand" href="/" aria-label="SmartSchools Platform Console">
          <span className="console-brand-mark">S</span>
          <span>smart<span>schools</span><small>PLATFORM CONSOLE</small></span>
        </Link>
        <div className="console-nav-label">PLATFORM</div>
        <nav className="console-nav" aria-label="Platform navigation">
          <a className="console-nav-active" href="#overview"><span>◫</span> Overview</a>
          <a href="#schools"><span>⌂</span> Schools</a>
          <a href="#onboarding"><span>↗</span> Onboarding</a>
        </nav>
        <div className="console-sidebar-bottom">
          <div className="console-user">
            <span className="console-user-avatar">SS</span>
            <span>
              <strong>{session?.user.email ?? "Platform team"}</strong>
              <small>{session ? "Authenticated operator" : "Operator sign-in required"}</small>
            </span>
          </div>
          {session ? (
            <button className="console-text-button" onClick={() => void handleSignOut()} type="button">Sign out</button>
          ) : (
            <Link href="https://smartschool-os-chi.vercel.app">← Back to SmartSchools</Link>
          )}
        </div>
      </aside>

      <section className="console-main" id="overview">
        <header className="console-topbar">
          <div className="console-breadcrumb">Platform <span>/</span> Overview</div>
          <div className="console-topbar-actions">
            <span className="console-preview-chip"><i /> {session ? "Live records" : "Secure sign-in"}</span>
            {session ? <button className="console-mobile-signout" onClick={() => void handleSignOut()} type="button">Sign out</button> : null}
            {session ? <span className="console-top-avatar">SS</span> : null}
          </div>
        </header>

        <div className="console-content">
          <div className="console-welcome-row">
            <div>
              <span className="console-eyebrow">SMARTSCHOOLS OPERATIONS</span>
              <h1>Platform overview</h1>
              <p>Review applications, provision schools, and manage their activation.</p>
            </div>
          </div>

          {!supabase ? (
            <div className="console-notice" role="alert">
              <span>!</span>
              <p>Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to sign in.</p>
            </div>
          ) : authLoading ? (
            <div className="console-notice" role="status"><span>…</span><p>Checking secure session…</p></div>
          ) : !session ? (
            <section className="console-panel console-auth-panel">
              <span className="console-eyebrow">AUTHORIZED OPERATORS ONLY</span>
              <h2>Sign in to the Platform Console</h2>
              <p>Use your SmartSchools operator account. School accounts do not have platform access.</p>
              <form className="console-auth-form" onSubmit={handleSignIn}>
                <label>Email address<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
                <label>Password<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
                {error ? <p className="console-error" role="alert">{error}</p> : null}
                <button className="console-primary-action" disabled={busyId === "sign-in"} type="submit">
                  {busyId === "sign-in" ? "Signing in…" : "Sign in securely"}
                </button>
              </form>
            </section>
          ) : (
            <>
              {error ? <div className="console-notice console-notice-error" role="alert"><span>!</span><p>{error}</p></div> : null}
              {notice ? <div className="console-notice console-notice-success" role="status"><span>✓</span><p>{notice}</p></div> : null}
              {error.includes("authorized SmartSchools platform operator") ? (
                <div className="console-notice"><span>i</span><p>Ask an existing operator to authorize this Supabase account before continuing.</p></div>
              ) : null}

              <section className="console-metrics" aria-label="Platform metrics">
                <article className="console-metric-card">
                  <div><span>Active schools</span><b>↗</b></div>
                  <strong>{activeSchools.toString().padStart(2, "0")}</strong>
                  <small><i className="metric-dot green" /> Publicly discoverable tenants</small>
                </article>
                <article className="console-metric-card">
                  <div><span>In onboarding</span><b>↗</b></div>
                  <strong>{onboardingSchools.toString().padStart(2, "0")}</strong>
                  <small><i className="metric-dot gold" /> Private tenant setup</small>
                </article>
                <article className="console-metric-card">
                  <div><span>Applications in review</span><b>↗</b></div>
                  <strong>{applications.length.toString().padStart(2, "0")}</strong>
                  <small><i className="metric-dot blue" /> Awaiting an operator decision</small>
                </article>
                <article className="console-metric-card">
                  <div><span>Directory visibility</span><b>↗</b></div>
                  <strong className="metric-status">Verified</strong>
                  <small><i className="metric-dot green" /> Active schools only</small>
                </article>
              </section>

              <div className="console-content-grid">
                <section className="console-panel console-schools" id="onboarding">
                  <div className="console-panel-heading">
                    <div><span className="console-eyebrow">APPLICATION REVIEW</span><h2>School applications</h2></div>
                    <span className="console-panel-count">{applications.length} pending</span>
                  </div>
                  {loading ? <p className="console-empty">Loading applications…</p> : applications.length ? (
                    <div className="console-table-wrap">
                      <table>
                        <thead><tr><th>School</th><th>Applicant</th><th>Submitted</th><th>Review</th></tr></thead>
                        <tbody>
                          {applications.map((application) => (
                            <tr key={application.id}>
                              <td>
                                <div className="console-school-name">
                                  <span className="console-school-avatar">{application.schoolName.slice(0, 2).toUpperCase()}</span>
                                  <span><strong>{application.schoolName}</strong><small>{application.location} · {application.schoolType} · Admin: {application.administratorEmail}</small></span>
                                </div>
                              </td>
                              <td className="console-date">{application.contactEmail}</td>
                              <td className="console-date">{formatDate(application.createdAt)}</td>
                              <td>
                                <div className="console-row-actions">
                                  <button disabled={busyId === application.id} onClick={() => void reviewApplication(application, "approve")} type="button">Approve</button>
                                  <button className="console-danger-action" disabled={busyId === application.id} onClick={() => void reviewApplication(application, "reject")} type="button">Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="console-empty">{error ? "Applications could not be loaded." : "No applications are waiting for review."}</p>
                  )}
                  <p className="console-sample-caption">Approval creates a private tenant and invites its first administrator.</p>
                </section>

                <section className="console-panel console-schools" id="schools">
                  <div className="console-panel-heading">
                    <div><span className="console-eyebrow">TENANT DIRECTORY</span><h2>Schools</h2></div>
                    <span className="console-panel-count">{schools.length} total</span>
                  </div>
                  {loading ? <p className="console-empty">Loading schools…</p> : schools.length ? (
                    <div className="console-table-wrap">
                      <table>
                        <thead><tr><th>School</th><th>Status</th><th>Administrator</th><th>Actions</th></tr></thead>
                        <tbody>
                          {schools.map((school) => {
                            const administrator = school.memberships[0];
                            return (
                              <tr key={school.id}>
                                <td>
                                  <div className="console-school-name">
                                    <span className="console-school-avatar">{school.name.slice(0, 2).toUpperCase()}</span>
                                    <span><strong>{school.name}</strong><small>{school.location ?? school.slug} · {school.schoolCode}</small></span>
                                  </div>
                                </td>
                                <td><span className={`console-status status-${school.status.toLowerCase()}`}><i />{school.status}</span></td>
                                <td className="console-date">{administrator?.status ?? "Not invited"}</td>
                                <td>
                                  <div className="console-row-actions">
                                    {administrator?.status === "INVITE_FAILED" || administrator?.status === "INVITE_PENDING" ? (
                                      <button disabled={busyId === school.id} onClick={() => void retryInvitation(school)} type="button">Send / retry invite</button>
                                    ) : null}
                                    {school.status === "ONBOARDING" && administrator?.status === "ACTIVE" ? (
                                      <button disabled={busyId === school.id} onClick={() => void activateSchool(school)} type="button">Activate</button>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="console-empty">{error ? "Schools could not be loaded." : "No schools have been provisioned yet."}</p>
                  )}
                  <p className="console-sample-caption">Only active, discoverable schools appear in the public directory.</p>
                </section>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
