"use client";

import Link from "next/link";
import { ThemeToggle } from "@smartschools/ui/theme-toggle";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { apiRequest } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type DashboardData = {
  school: { id: string; name: string; slug: string; status: "ONBOARDING" | "ACTIVE" };
  campuses: { id: string; name: string; isMainSite: boolean }[];
  academicYears: {
    id: string;
    name: string;
    startsOn: string;
    endsOn: string;
    status: "PLANNED" | "ACTIVE" | "COMPLETED";
    terms: { id: string; name: string; startsOn: string; endsOn: string }[];
  }[];
  grades: { id: string; name: string }[];
  classArms: {
    id: string;
    name: string;
    campus: { id: string; name: string };
    academicYear: { id: string; name: string };
    grade: { id: string; name: string };
  }[];
  subjects: { id: string; name: string }[];
  subjectOfferings: { id: string }[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function SchoolAdminDashboard({ schoolSlug }: { schoolSlug: string }) {
  const [supabase] = useState(getSupabaseBrowserClient);
  const [session, setSession] = useState<Session | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<DashboardData>(
        `/schools/${encodeURIComponent(schoolSlug)}/setup`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        },
      );
      setDashboard(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load the school dashboard.",
      );
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [schoolSlug]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setAuthLoading(false);
      if (data.session) void loadDashboard(data.session.access_token);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setDashboard(null);
      setError("");
      if (nextSession) void loadDashboard(nextSession.access_token);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadDashboard, supabase]);

  if (!supabase) {
    return <DashboardMessage title="Sign-in is not configured" message="Set the public Supabase URL and publishable key for this app before opening the school dashboard." />;
  }
  if (authLoading || loading && !dashboard) {
    return <DashboardMessage title="Loading your dashboard" message="Checking your administrator access…" />;
  }
  if (!session) {
    return (
      <DashboardMessage title="Sign in to continue" message="The school dashboard is available to active administrators of this school.">
        <Link className="button button-dark" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin`}>
          Go to administrator sign-in
        </Link>
      </DashboardMessage>
    );
  }
  if (!dashboard) {
    return (
      <DashboardMessage title="Could not open the dashboard" message={error || "Your account may not have administrator access to this school."}>
        <button className="button button-dark" onClick={() => session && void loadDashboard(session.access_token)} type="button">
          Try again
        </button>
        <button className="dashboard-signout-link" onClick={() => void supabase?.auth.signOut()} type="button">
          Sign out
        </button>
      </DashboardMessage>
    );
  }

  const currentYear =
    dashboard.academicYears.find((year) => year.status === "ACTIVE") ??
    dashboard.academicYears[0];
  const steps = [
    { label: "Campuses", count: dashboard.campuses.length },
    { label: "Academic years", count: dashboard.academicYears.length },
    { label: "Grade levels", count: dashboard.grades.length },
    { label: "Class groups", count: dashboard.classArms.length },
    { label: "Subjects", count: dashboard.subjects.length },
    { label: "Subject offerings", count: dashboard.subjectOfferings.length },
  ];
  const completedSteps = steps.filter((step) => step.count > 0).length;
  const completion = Math.round((completedSteps / steps.length) * 100);
  const administratorName = session.user.email?.split("@")[0] || "Administrator";

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/dashboard`} aria-label="SmartSchools dashboard">
          <span className="brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>smart<span className="wordmark-strong">schools</span></span>
        </Link>

        <div className="admin-school-switcher">
          <span className="admin-school-avatar">{initials(dashboard.school.name)}</span>
          <span><strong>{dashboard.school.name}</strong><small>School workspace</small></span>
          <span aria-hidden="true" className="admin-school-chevron">⌄</span>
        </div>

        <nav className="admin-nav" aria-label="School administration">
          <p className="admin-nav-label">WORKSPACE</p>
          <Link className="admin-nav-item is-active" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/dashboard`}>
            <span className="admin-nav-icon" aria-hidden="true">⌂</span>Overview
          </Link>
          <Link className="admin-nav-item" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/setup`}>
            <span className="admin-nav-icon" aria-hidden="true">▦</span>School setup
            {completedSteps < steps.length ? <span className="admin-nav-dot" /> : null}
          </Link>

          <p className="admin-nav-label">ACADEMICS</p>
          <Link className="admin-nav-item" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/setup#class-arms`}>
            <span className="admin-nav-icon" aria-hidden="true">▤</span>Classes & subjects
          </Link>
          <ComingSoonNavItem icon="◷" label="Curriculum" />
          <ComingSoonNavItem icon="▱" label="Timetable" />

          <p className="admin-nav-label">COMMUNITY</p>
          <Link className="admin-nav-item" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/people`}>
            <span className="admin-nav-icon" aria-hidden="true">♙</span>People & class rosters
          </Link>
          <ComingSoonNavItem icon="♧" label="Families & progress" />
          <ComingSoonNavItem icon="♧" label="Staff" />

          <p className="admin-nav-label">OPERATIONS</p>
          <ComingSoonNavItem icon="✓" label="Attendance" />
          <ComingSoonNavItem icon="¤" label="Fees & payments" />
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-avatar">{administratorName.slice(0, 1).toUpperCase()}</div>
          <div className="admin-user-copy"><strong>{administratorName}</strong><small>School administrator</small></div>
          <button aria-label="Sign out" className="admin-signout" onClick={() => void supabase.auth.signOut()} type="button" title="Sign out">
            ↗
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Workspace</span><b>/</b><strong>Overview</strong></div>
          <div className="admin-topbar-actions">
            <ThemeToggle />
            <span className={`admin-status-pill admin-status-${dashboard.school.status.toLowerCase()}`}>
              <i />{dashboard.school.status === "ACTIVE" ? "School active" : "Onboarding"}
            </span>
            <span className="admin-school-code">School URL <strong>{dashboard.school.slug}</strong></span>
            <button className="admin-user-avatar admin-topbar-avatar" aria-label="Sign out" onClick={() => void supabase.auth.signOut()} type="button">
              {administratorName.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-welcome">
            <div>
              <span className="admin-eyebrow">SCHOOL ADMINISTRATOR · OVERVIEW</span>
              <h1>Good to see you, {administratorName}.</h1>
              <p>Here’s the foundation of {dashboard.school.name}. Your school data is shared across every workspace.</p>
            </div>
            <div className="admin-welcome-actions">
              <Link className="admin-button admin-button-primary" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/setup`}>
                Continue setup <span aria-hidden="true">→</span>
              </Link>
              <Link className="admin-button admin-button-quiet" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/people`}>
                People & classes
              </Link>
              <Link className="admin-button admin-button-quiet" href={`/s/${encodeURIComponent(schoolSlug)}`}>
                School workspace
              </Link>
            </div>
          </section>

          {error ? <div className="admin-alert" role="alert">{error}</div> : null}

          <section className="admin-metrics" aria-label="School foundation overview">
            <MetricCard icon="▦" label="Campuses" value={dashboard.campuses.length} tone="green" />
            <MetricCard icon="▤" label="Class groups" value={dashboard.classArms.length} tone="blue" />
            <MetricCard icon="◈" label="Subjects" value={dashboard.subjects.length} tone="violet" />
            <MetricCard icon="◷" label="Academic years" value={dashboard.academicYears.length} tone="amber" />
          </section>

          <div className="admin-dashboard-grid">
            <section className="admin-panel admin-setup-panel">
              <div className="admin-panel-heading">
                <div><span className="admin-eyebrow">GETTING STARTED</span><h2>School foundation</h2></div>
                <Link href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/setup`}>Manage setup <span aria-hidden="true">→</span></Link>
              </div>
              <div className="admin-progress-summary">
                <div className="admin-progress-ring" style={{ "--progress": `${completion}%` } as CSSProperties}>
                  <span>{completion}<small>%</small></span>
                </div>
                <div><strong>{completedSteps} of {steps.length} areas started</strong><p>Set up the shared structure your academic and school services will use.</p></div>
              </div>
              <div className="admin-checklist">
                {steps.map((step) => (
                  <div className="admin-checklist-row" key={step.label}>
                    <span className={`admin-step-indicator${step.count ? " is-done" : ""}`} aria-hidden="true">{step.count ? "✓" : ""}</span>
                    <span>{step.label}</span>
                    <strong>{step.count ? `${step.count} added` : "Next step"}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-panel admin-year-panel">
              <div className="admin-panel-heading">
                <div><span className="admin-eyebrow">ACADEMIC CALENDAR</span><h2>{currentYear ? currentYear.name : "Your school year"}</h2></div>
                <span className={`admin-year-badge${currentYear?.status === "ACTIVE" ? " is-active" : ""}`}>
                  {currentYear?.status === "ACTIVE" ? "Current" : currentYear?.status === "COMPLETED" ? "Completed" : currentYear ? "Planned" : "Not set"}
                </span>
              </div>
              {currentYear ? (
                <>
                  <p className="admin-year-dates">{formatDate(currentYear.startsOn)} <span>→</span> {formatDate(currentYear.endsOn)}</p>
                  {currentYear.terms.length ? (
                    <div className="admin-term-list">
                      {currentYear.terms.map((term, index) => (
                        <div className="admin-term-row" key={term.id}>
                          <span className="admin-term-number">0{index + 1}</span>
                          <strong>{term.name}</strong>
                          <small>{formatDate(term.startsOn)} – {formatDate(term.endsOn)}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-empty-state"><span aria-hidden="true">◷</span><p>No terms yet. Add terms to organise your school calendar.</p></div>
                  )}
                </>
              ) : (
                <div className="admin-empty-state"><span aria-hidden="true">◷</span><p>Add an academic year and its terms to start planning the school calendar.</p></div>
              )}
              <Link className="admin-panel-link" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/setup`}>
                Manage academic years <span aria-hidden="true">→</span>
              </Link>
            </section>

            <section className="admin-panel admin-classes-panel" id="class-arms">
              <div className="admin-panel-heading">
                <div><span className="admin-eyebrow">SCHOOL STRUCTURE</span><h2>Class groups</h2></div>
                <span className="admin-count-badge">{dashboard.classArms.length}</span>
              </div>
              {dashboard.classArms.length ? (
                <div className="admin-class-list">
                  {dashboard.classArms.slice(0, 5).map((classArm) => (
                    <div className="admin-class-row" key={classArm.id}>
                      <span className="admin-class-symbol" aria-hidden="true">{classArm.grade.name.slice(0, 1).toUpperCase()}</span>
                      <div><strong>{classArm.grade.name} · {classArm.name}</strong><small>{classArm.campus.name} · {classArm.academicYear.name}</small></div>
                      <span className="admin-class-arrow" aria-hidden="true">↗</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-empty-state"><span aria-hidden="true">▤</span><p>Class groups connect grades to a campus and academic year.</p></div>
              )}
              <Link className="admin-panel-link" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/setup`}>
                Manage classes <span aria-hidden="true">→</span>
              </Link>
            </section>

            <section className="admin-panel admin-coming-panel">
              <div className="admin-panel-heading">
                <div><span className="admin-eyebrow">NEXT IN SMARTSCHOOLS</span><h2>Connected school life</h2></div>
                <span className="admin-sparkle" aria-hidden="true">✳</span>
              </div>
              <p className="admin-coming-intro">The same school foundation will power these connected experiences as they become available.</p>
              <div className="admin-coming-list">
                <ComingSoonItem icon="♙" title="Students & families" description="Enrolments, verified family links and learning progress" />
                <ComingSoonItem icon="✓" title="Attendance & communication" description="Class attendance and timely family updates" />
                <ComingSoonItem icon="¤" title="Fees & receipts" description="Parent payments, statements and receipts" />
                <ComingSoonItem icon="✳" title="Curriculum intelligence" description="Approved curriculum, teaching resources and AI support" />
              </div>
            </section>
          </div>

          <footer className="admin-dashboard-footer">
            <span>One connected foundation for {dashboard.school.name}.</span>
            <button onClick={() => void supabase.auth.signOut()} type="button">Sign out</button>
          </footer>
        </div>
      </section>
    </main>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function MetricCard({ icon, label, value, tone }: { icon: string; label: string; value: number; tone: string }) {
  return (
    <article className="admin-metric-card">
      <span className={`admin-metric-icon tone-${tone}`} aria-hidden="true">{icon}</span>
      <div><p>{label}</p><strong>{value.toLocaleString()}</strong></div>
      <span className="admin-metric-caption">in your school</span>
    </article>
  );
}

function ComingSoonNavItem({ icon, label }: { icon: string; label: string }) {
  return <span aria-disabled="true" className="admin-nav-item is-disabled"><span className="admin-nav-icon" aria-hidden="true">{icon}</span>{label}<small>Soon</small></span>;
}

function ComingSoonItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="admin-coming-item">
      <span className="admin-coming-icon" aria-hidden="true">{icon}</span>
      <div><strong>{title}</strong><small>{description}</small></div>
      <span className="admin-coming-badge">Coming soon</span>
    </div>
  );
}

function DashboardMessage({ title, message, children }: { title: string; message: string; children?: ReactNode }) {
  return (
    <main className="admin-dashboard-message">
      <section><span className="admin-eyebrow">SMARTSCHOOLS · SCHOOL ADMIN</span><h1>{title}</h1><p>{message}</p>{children}</section>
    </main>
  );
}
