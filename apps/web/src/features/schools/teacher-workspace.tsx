"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { ThemeToggle } from "@smartschools/ui/theme-toggle";
import { apiRequest } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Assignment = {
  id: string;
  subjectOffering: {
    subject: { id: string; name: string; code: string | null };
    term: {
      id: string;
      name: string;
      startsOn: string;
      endsOn: string;
      academicYear: { id: string; name: string };
    };
    classArm: {
      id: string;
      name: string;
      grade: { name: string };
      campus: { name: string };
      academicYear: { id: string; name: string };
      _count: { studentEnrollments: number };
    };
  };
  _count: { classwork: number };
};

type Classwork = {
  id: string;
  type: "LESSON" | "TASK";
  status: "DRAFT" | "SHARED";
  title: string;
  content: string;
  dueAt: string | null;
  sharedAt: string | null;
  createdAt: string;
};

type AssignmentDetail = {
  assignment: Omit<Assignment, "_count">;
  roster: {
    id: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      studentNumber: string | null;
    };
  }[];
  classwork: Classwork[];
};

type TeacherWorkspaceData = {
  school: { id: string; name: string; slug: string };
  teacher: { id: string; email: string };
  assignments: Assignment[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function TeacherWorkspace({ schoolSlug }: { schoolSlug: string }) {
  const [supabase] = useState(getSupabaseBrowserClient);
  const authGeneration = useRef(0);
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspace] = useState<TeacherWorkspaceData | null>(null);
  const [selected, setSelected] = useState<AssignmentDetail | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [openingAssignmentId, setOpeningAssignmentId] = useState<string | null>(null);
  const [sharingClassworkId, setSharingClassworkId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadWorkspace = useCallback(async (accessToken: string, generation: number) => {
    try {
      const data = await apiRequest<TeacherWorkspaceData>(
        `/schools/${encodeURIComponent(schoolSlug)}/teacher/workspace`,
        { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
      );
      if (generation !== authGeneration.current) return;
      setWorkspace(data);
      setError("");
    } catch (loadError) {
      if (generation !== authGeneration.current) return;
      setWorkspace(null);
      setError(loadError instanceof Error ? loadError.message : "Could not load your teacher workspace.");
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
      setSelected(null);
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

  async function openAssignment(assignmentId: string) {
    if (!session) return;
    setOpeningAssignmentId(assignmentId);
    setError("");
    setNotice("");
    try {
      const data = await apiRequest<AssignmentDetail>(
        `/schools/${encodeURIComponent(schoolSlug)}/teacher/assignments/${encodeURIComponent(assignmentId)}`,
        { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" },
      );
      setSelected(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not open this class.");
    } finally {
      setOpeningAssignmentId(null);
    }
  }

  async function createClasswork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !selected) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const dueAt = String(values.get("dueAt") ?? "");
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const created = await apiRequest<Classwork>(
        `/schools/${encodeURIComponent(schoolSlug)}/teacher/assignments/${encodeURIComponent(selected.assignment.id)}/classwork`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            type: String(values.get("type")),
            title: String(values.get("title") ?? ""),
            content: String(values.get("content") ?? ""),
            ...(dueAt ? { dueAt: new Date(`${dueAt}T23:59:59`).toISOString() } : {}),
          }),
        },
      );
      setSelected((current) => current ? { ...current, classwork: [created, ...current.classwork] } : current);
      setWorkspace((current) => current ? {
        ...current,
        assignments: current.assignments.map((assignment) =>
          assignment.id === selected.assignment.id
            ? { ...assignment, _count: { classwork: assignment._count.classwork + 1 } }
            : assignment,
        ),
      } : current);
      setNotice(`${created.type === "LESSON" ? "Lesson" : "Task"} saved to this class.`);
      form.reset();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this lesson or task.");
    } finally {
      setSaving(false);
    }
  }

  async function shareClasswork(classworkId: string) {
    if (!session || !selected) return;
    setSharingClassworkId(classworkId);
    setError("");
    setNotice("");
    try {
      const shared = await apiRequest<Pick<Classwork, "id" | "status" | "sharedAt">>(
        `/schools/${encodeURIComponent(schoolSlug)}/teacher/assignments/${encodeURIComponent(selected.assignment.id)}/classwork/${encodeURIComponent(classworkId)}/share`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({}),
        },
      );
      setSelected((current) => current ? {
        ...current,
        classwork: current.classwork.map((item) =>
          item.id === shared.id ? { ...item, status: shared.status, sharedAt: shared.sharedAt } : item,
        ),
      } : current);
      setNotice("Lesson or task shared with students in this class.");
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "Could not share this lesson or task.");
    } finally {
      setSharingClassworkId(null);
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

  const assignedClasses = new Set(workspace?.assignments.map(({ subjectOffering }) => subjectOffering.classArm.id));
  const schoolAdminHref = `/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/dashboard`;

  return (
    <main className="teacher-workspace">
      <header className="teacher-topbar">
        <Link className="wordmark" href="/" aria-label="SmartSchools home">
          <span className="brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>smart<span className="wordmark-strong">schools</span></span>
        </Link>
        <div className="teacher-topbar-actions">
          {workspace ? <span className="teacher-school-label">{workspace.school.name} · Teacher</span> : null}
          <ThemeToggle />
          {session ? <button className="teacher-signout" onClick={() => void signOut()} type="button">Sign out</button> : null}
        </div>
      </header>

      <div className="teacher-content">
        <Link className="teacher-back-link" href={schoolAdminHref}>← School workspace</Link>
        <section className="teacher-welcome">
          <div>
            <span className="teacher-eyebrow">YOUR TEACHING SPACE</span>
            <h1>{workspace ? `Welcome, ${workspace.teacher.email.split("@")[0]}.` : "Your classes, connected."}</h1>
            <p>See your assigned teaching, get to know your class, and prepare lessons and tasks.</p>
          </div>
          {workspace ? (
            <div className="teacher-summary">
              <span><strong>{workspace.assignments.length}</strong> subject assignments</span>
              <span><strong>{assignedClasses.size}</strong> class groups</span>
            </div>
          ) : null}
        </section>

        {error ? <div className="teacher-notice teacher-notice-error" role="alert">{error}</div> : null}
        {notice ? <div className="teacher-notice teacher-notice-success" role="status">{notice}</div> : null}

        {!supabase ? (
          <section className="teacher-empty-state" role="alert">
            <h2>Sign-in is not configured.</h2>
            <p>The school account provider is not configured for this site. Contact your school administrator.</p>
          </section>
        ) : authLoading || (session && !workspace && !error) ? (
          <section className="teacher-empty-state" role="status"><p>Loading your assigned classes…</p></section>
        ) : !session ? (
          <section className="teacher-empty-state">
            <span className="teacher-state-icon">↗</span>
            <h2>Sign in to see your classes.</h2>
            <p>Use the teacher account invited by your school administrator. Your assignments are private to your school membership.</p>
            <Link className="teacher-primary-button" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/teacher`}>Go to teacher sign in</Link>
          </section>
        ) : workspace ? (
          <div className="teacher-dashboard-grid">
            <section className="teacher-assignment-section">
              <div className="teacher-section-heading">
                <div><span className="teacher-eyebrow">YOUR TIMETABLE</span><h2>Assigned classes</h2></div>
                <span>{workspace.assignments.length} subjects</span>
              </div>
              {workspace.assignments.length ? (
                <div className="teacher-assignment-list">
                  {workspace.assignments.map((assignment) => {
                    const offering = assignment.subjectOffering;
                    return (
                      <article className={`teacher-assignment-card${selected?.assignment.id === assignment.id ? " is-selected" : ""}`} key={assignment.id}>
                        <div className="teacher-assignment-card-top">
                          <span className="teacher-subject-mark">{offering.subject.name.slice(0, 1)}</span>
                          <span className="teacher-work-count">{assignment._count.classwork} prepared</span>
                        </div>
                        <h3>{offering.subject.name}</h3>
                        <p>{offering.classArm.grade.name} · {offering.classArm.name}</p>
                        <div className="teacher-assignment-meta">
                          <span>{offering.term.academicYear.name} · {offering.term.name}</span>
                          <span>{offering.classArm.campus.name}</span>
                        </div>
                        <button className="teacher-open-class" disabled={Boolean(openingAssignmentId)} onClick={() => void openAssignment(assignment.id)} type="button">
                          {openingAssignmentId === assignment.id ? "Opening…" : "Open class & roster"} <span aria-hidden="true">→</span>
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="teacher-empty-state teacher-empty-assignment">
                  <span className="teacher-state-icon">✳</span>
                  <h2>No subject assignments yet.</h2>
                  <p>When your school administrator assigns you to a class and subject, it will appear here.</p>
                </div>
              )}
            </section>

            <section aria-live="polite" className="teacher-class-panel">
              {selected ? (
                <ClassWorkspace
                  detail={selected}
                  onShare={shareClasswork}
                  onSubmit={createClasswork}
                  saving={saving}
                  sharingClassworkId={sharingClassworkId}
                />
              ) : (
                <div className="teacher-class-placeholder">
                  <span className="teacher-placeholder-orbit">✳</span>
                  <span className="teacher-eyebrow">CLASSROOM PREPARATION</span>
                  <h2>Choose a class to get started.</h2>
                  <p>Open any assigned subject to see its current roster and prepare class materials.</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <section className="teacher-empty-state">
            <h2>We couldn’t load your assignments.</h2>
            <p>Check that you have an active teacher invitation at this school, or contact the school administrator.</p>
            <button className="teacher-secondary-button" onClick={() => void signOut()} type="button">Sign out</button>
          </section>
        )}
      </div>
    </main>
  );
}

function ClassWorkspace({
  detail,
  onShare,
  onSubmit,
  saving,
  sharingClassworkId,
}: {
  detail: AssignmentDetail;
  onShare: (classworkId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  sharingClassworkId: string | null;
}) {
  const offering = detail.assignment.subjectOffering;
  return (
    <div className="teacher-class-detail">
      <div className="teacher-class-heading">
        <span className="teacher-eyebrow">CLASS OVERVIEW</span>
        <h2>{offering.classArm.grade.name} · {offering.classArm.name}</h2>
        <p>{offering.subject.name} · {offering.term.academicYear.name} · {offering.term.name}</p>
        <span className="teacher-class-campus">{offering.classArm.campus.name}</span>
      </div>

      <section className="teacher-roster-section">
        <div className="teacher-section-heading">
          <div><span className="teacher-eyebrow">STUDENT LIST</span><h3>Class roster</h3></div>
          <span>{detail.roster.length} students</span>
        </div>
        {detail.roster.length ? (
          <ol className="teacher-roster">
            {detail.roster.map(({ id, student }, index) => (
              <li key={id}>
                <span className="teacher-roster-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="teacher-student-avatar">{`${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`}</span>
                <span className="teacher-student-name">{student.firstName} {student.lastName}</span>
                <span className="teacher-student-number">{student.studentNumber || "—"}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="teacher-roster-empty">No students are enrolled in this class for this academic year yet.</p>
        )}
      </section>

      <section className="teacher-classwork-section">
        <div className="teacher-section-heading">
          <div><span className="teacher-eyebrow">PREPARATION</span><h3>Lessons & tasks</h3></div>
          <span>{detail.classwork.length} saved</span>
        </div>
        <form className="teacher-classwork-form" onSubmit={onSubmit}>
          <label>Prepare
            <select defaultValue="LESSON" name="type">
              <option value="LESSON">Lesson</option>
              <option value="TASK">Class task</option>
            </select>
          </label>
          <label>Title
            <input maxLength={160} name="title" placeholder="e.g. Fractions and equivalent values" required />
          </label>
          <label>Lesson notes or task instructions
            <textarea maxLength={10000} minLength={1} name="content" placeholder="Add the learning goal, key points, or what students should do…" required rows={4} />
          </label>
          <label>Due date <span className="teacher-optional-label">Optional</span>
            <input name="dueAt" type="date" />
          </label>
          <p className="teacher-draft-note">Drafts are private to you. Share an item when it is ready for students in this class.</p>
          <button className="teacher-primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Save lesson or task"} <span aria-hidden="true">→</span></button>
        </form>

        {detail.classwork.length ? (
          <ul className="teacher-classwork-list">
            {detail.classwork.map((item) => (
              <li key={item.id}>
                <span className={`teacher-classwork-type teacher-classwork-${item.type.toLowerCase()}`}>{item.type === "LESSON" ? "LESSON" : "TASK"}</span>
                <div><strong>{item.title}</strong><p>{item.content}</p>
                  <small>{item.dueAt ? `Due ${formatDate(item.dueAt)}` : `Saved ${formatDate(item.createdAt)}`}</small>
                  <small className={`teacher-classwork-status teacher-classwork-status-${item.status.toLowerCase()}`}>
                    {item.status === "SHARED" ? "Shared with students" : "Private draft"}
                  </small>
                </div>
                {item.status === "DRAFT" ? (
                  <button
                    className="teacher-share-button"
                    disabled={Boolean(sharingClassworkId)}
                    onClick={() => onShare(item.id)}
                    type="button"
                  >
                    {sharingClassworkId === item.id ? "Sharing…" : "Share with students"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
