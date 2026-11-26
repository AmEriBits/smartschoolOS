"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { ThemeToggle } from "@smartschools/ui/theme-toggle";
import { apiRequest } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SharedWork = {
  id: string;
  type: "LESSON" | "TASK";
  title: string;
  content: string;
  dueAt: string | null;
  sharedAt: string | null;
};

type StudentClass = {
  id: string;
  academicYear: { id: string; name: string; startsOn: string; endsOn: string };
  classArm: {
    id: string;
    name: string;
    grade: { name: string };
    campus: { name: string };
  };
  subjects: {
    subject: { id: string; name: string; code: string | null };
    term: {
      id: string;
      name: string;
      startsOn: string;
      endsOn: string;
      academicYear: { id: string; name: string };
    };
    classwork: SharedWork[];
  }[];
};

type StudentWorkspaceData = {
  school: { id: string; name: string; slug: string };
  student: {
    id: string;
    loginId: string | null;
    firstName: string;
    lastName: string;
  };
  needsPasswordChange: boolean;
  classes: StudentClass[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function StudentWorkspace({ schoolSlug }: { schoolSlug: string }) {
  const [supabase] = useState(getSupabaseBrowserClient);
  const authGeneration = useRef(0);
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspace] = useState<StudentWorkspaceData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadWorkspace = useCallback(async (accessToken: string, generation: number) => {
    try {
      const data = await apiRequest<StudentWorkspaceData>(
        `/schools/${encodeURIComponent(schoolSlug)}/student/workspace`,
        { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
      );
      if (generation !== authGeneration.current) return;
      setWorkspace(data);
      setError("");
    } catch (loadError) {
      if (generation !== authGeneration.current) return;
      setWorkspace(null);
      setError(loadError instanceof Error ? loadError.message : "Could not load your student workspace.");
    }
  }, [schoolSlug]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      const generation = ++authGeneration.current;
      setSession(nextSession);
      setWorkspace(null);
      setError("");
      setNotice("");
      setAuthLoading(false);
      if (nextSession) void loadWorkspace(nextSession.access_token, generation);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadWorkspace, supabase]);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(
        `/schools/${encodeURIComponent(schoolSlug)}/student/password`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ currentPassword, newPassword }),
        },
      );
      setNotice("Password updated. Your student workspace is ready.");
      await loadWorkspace(session.access_token, authGeneration.current);
      formElement.reset();
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "Could not update your password.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) setError(signOutError.message);
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not sign out.");
    }
  }

  const signInHref = `/s/${encodeURIComponent(schoolSlug)}/workspace/student`;

  return (
    <main className="student-workspace">
      <header className="student-topbar">
        <Link className="wordmark" href="/" aria-label="SmartSchools home">
          <span className="brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>smart<span className="wordmark-strong">schools</span></span>
        </Link>
        <div className="student-topbar-actions">
          {workspace ? <span className="student-school-label">{workspace.school.name} · Student</span> : null}
          <ThemeToggle />
          {session ? <button className="student-signout" onClick={() => void signOut()} type="button">Sign out</button> : null}
        </div>
      </header>

      <div className="student-content">
        <Link className="student-back-link" href={`/s/${encodeURIComponent(schoolSlug)}`}>← School workspace</Link>
        {error ? <div className="student-notice student-notice-error" role="alert">{error}</div> : null}
        {notice ? <div className="student-notice student-notice-success" role="status">{notice}</div> : null}

        {!supabase ? (
          <section className="student-empty-state" role="alert">
            <h1>Sign-in is not configured.</h1>
            <p>Contact your school administrator to restore student sign-in.</p>
          </section>
        ) : authLoading || (session && !workspace && !error) ? (
          <section className="student-empty-state" role="status"><p>Loading your classes…</p></section>
        ) : !session ? (
          <section className="student-empty-state">
            <span className="student-state-icon">↗</span>
            <h1>Sign in to your learning space.</h1>
            <p>Your school-issued Student ID and password open only your own enrolled classes and shared learning materials.</p>
            <Link className="student-primary-button" href={signInHref}>Go to student sign in</Link>
          </section>
        ) : error && !workspace ? (
          <section className="student-empty-state">
            <h1>We couldn’t load your workspace.</h1>
            <p>Check with your school administrator if your student account should have access.</p>
            <button className="student-secondary-button" onClick={() => void signOut()} type="button">Sign out</button>
          </section>
        ) : workspace?.needsPasswordChange ? (
          <section className="student-password-card">
            <span className="student-eyebrow">FIRST SIGN IN</span>
            <h1>Set a new password.</h1>
            <p>Replace the temporary password from your school before opening your classes.</p>
            <form onSubmit={changePassword}>
              <label>Temporary password
                <input autoComplete="current-password" minLength={8} name="currentPassword" required type="password" />
              </label>
              <label>New password
                <input autoComplete="new-password" minLength={8} name="newPassword" required type="password" />
              </label>
              <label>Confirm new password
                <input autoComplete="new-password" minLength={8} name="confirmPassword" required type="password" />
              </label>
              <button className="student-primary-button" disabled={busy} type="submit">
                {busy ? "Updating…" : "Update password"}
              </button>
            </form>
          </section>
        ) : workspace ? (
          <>
            <section className="student-welcome">
              <div>
                <span className="student-eyebrow">YOUR LEARNING SPACE</span>
                <h1>Welcome, {workspace.student.firstName}.</h1>
                <p>Here are your enrolled classes and the lessons and tasks your teachers have shared with you.</p>
              </div>
              <div className="student-summary">
                <span><strong>{workspace.classes.length}</strong> enrolled classes</span>
                <span><strong>{workspace.classes.reduce((total, item) => total + item.subjects.reduce((sum, subject) => sum + subject.classwork.length, 0), 0)}</strong> shared items</span>
              </div>
            </section>

            {workspace.classes.length ? (
              <div className="student-class-list">
                {workspace.classes.map((classItem) => (
                  <section className="student-class-card" key={classItem.id}>
                    <header className="student-class-heading">
                      <div>
                        <span className="student-eyebrow">{classItem.academicYear.name}</span>
                        <h2>{classItem.classArm.grade.name} · {classItem.classArm.name}</h2>
                        <p>{classItem.classArm.campus.name}</p>
                      </div>
                      <span className="student-class-dates">
                        {formatDate(classItem.academicYear.startsOn)} – {formatDate(classItem.academicYear.endsOn)}
                      </span>
                    </header>
                    {classItem.subjects.length ? (
                      <div className="student-subject-list">
                        {classItem.subjects.map((subject) => (
                          <article className="student-subject-card" key={`${subject.subject.id}-${subject.term.id}`}>
                            <header>
                              <div><h3>{subject.subject.name}</h3><span>{subject.term.academicYear.name} · {subject.term.name}</span></div>
                              <span>{subject.classwork.length} shared</span>
                            </header>
                            {subject.classwork.length ? (
                              <ul className="student-shared-work-list">
                                {subject.classwork.map((item) => (
                                  <li key={item.id}>
                                    <span className={`student-work-type student-work-${item.type.toLowerCase()}`}>
                                      {item.type === "LESSON" ? "LESSON" : "TASK"}
                                    </span>
                                    <div>
                                      <strong>{item.title}</strong>
                                      <p>{item.content}</p>
                                      <small>
                                        {item.dueAt
                                          ? `Due ${formatDate(item.dueAt)}`
                                          : item.sharedAt
                                            ? `Shared ${formatDate(item.sharedAt)}`
                                            : "Shared with your class"}
                                      </small>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="student-no-work">Your teacher hasn’t shared any lessons or tasks here yet.</p>}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="student-no-work">Your school hasn’t connected subject assignments to this class yet.</p>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <section className="student-empty-state">
                <span className="student-state-icon">✳</span>
                <h2>No class enrolments found.</h2>
                <p>Ask your school administrator to check your student record and current class enrolment.</p>
              </section>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
