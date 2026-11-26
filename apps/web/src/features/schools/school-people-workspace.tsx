"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ThemeToggle } from "@smartschools/ui/theme-toggle";
import type { Session } from "@supabase/supabase-js";
import { apiRequest } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type PeopleData = {
  school: { id: string; name: string; slug: string; status: string };
  teachers: {
    id: string;
    email: string;
    status: string;
    createdAt: string;
  }[];
  students: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string | null;
    loginId: string | null;
    loginMembership: { status: string; needsPasswordChange: boolean } | null;
    enrollments: {
      id: string;
      classArm: {
        id: string;
        name: string;
        grade: { name: string };
        campus: { name: string };
      };
      academicYear: { id: string; name: string };
    }[];
  }[];
  classArms: {
    id: string;
    name: string;
    academicYear: { id: string; name: string };
    campus: { name: string };
    grade: { name: string };
  }[];
  subjectOfferings: {
    id: string;
    subject: { name: string };
    term: { name: string; academicYear: { name: string } };
    classArm: {
      name: string;
      grade: { name: string };
      campus: { name: string };
    };
  }[];
  teacherAssignments: {
    id: string;
    teacher: { id: string; email: string; status: string };
    subjectOffering: {
      subject: { name: string };
      term: { name: string; academicYear: { name: string } };
      classArm: {
        name: string;
        grade: { name: string };
        campus: { name: string };
      };
    };
  }[];
};

type StudentCredentials = {
  student: { id: string; firstName: string; lastName: string };
  loginId: string;
  temporaryPassword: string;
};

function PeopleMessage({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <main className="school-setup-page">
      <section className="setup-message">
        <span className="setup-eyebrow">SMARTSCHOOLS · SCHOOL ADMIN</span>
        <h1>{title}</h1>
        <p>{message}</p>
        {children}
      </section>
    </main>
  );
}

function teacherStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

export function SchoolPeopleWorkspace({ schoolSlug }: { schoolSlug: string }) {
  const [supabase] = useState(getSupabaseBrowserClient);
  const [session, setSession] = useState<Session | null>(null);
  const [people, setPeople] = useState<PeopleData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [issuedCredentials, setIssuedCredentials] = useState<StudentCredentials | null>(null);

  const loadPeople = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<PeopleData>(
        `/schools/${encodeURIComponent(schoolSlug)}/people`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        },
      );
      setPeople(data);
    } catch (loadError) {
      setPeople(null);
      setError(loadError instanceof Error ? loadError.message : "Could not load school people.");
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
      if (data.session) void loadPeople(data.session.access_token);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setPeople(null);
      setError("");
      if (nextSession) void loadPeople(nextSession.access_token);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadPeople, supabase]);

  async function mutate(
    path: string,
    payload: Record<string, string>,
    label: string,
    form?: HTMLFormElement,
  ) {
    if (!session) return;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/schools/${encodeURIComponent(schoolSlug)}/people/${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      form?.reset();
      setNotice(label);
      await loadPeople(session.access_token);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : `Could not ${label.toLowerCase()}.`);
    } finally {
      setBusy("");
    }
  }

  function inviteTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    void mutate("teachers", { email }, "Teacher invitation sent", form);
  }

  function createStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    void mutate("students", {
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      studentNumber: String(data.get("studentNumber") ?? ""),
      classArmId: String(data.get("classArmId") ?? ""),
    }, "Student enrolled", form);
  }

  function assignTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    void mutate("teacher-assignments", {
      teacherMembershipId: String(data.get("teacherMembershipId") ?? ""),
      subjectOfferingId: String(data.get("subjectOfferingId") ?? ""),
    }, "Teacher assigned", form);
  }

  async function removeAssignment(assignmentId: string) {
    if (!session || !window.confirm("Remove this teacher assignment?")) return;
    setBusy(assignmentId);
    setError("");
    setNotice("");
    try {
      await apiRequest(
        `/schools/${encodeURIComponent(schoolSlug)}/people/teacher-assignments/${assignmentId}/remove`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({}),
        },
      );
      setNotice("Teacher assignment removed");
      await loadPeople(session.access_token);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove teacher assignment.");
    } finally {
      setBusy("");
    }

  }

  async function issueStudentCredentials(studentId: string) {
    if (!session) return;
    setBusy(studentId);
    setError("");
    setNotice("");
    setIssuedCredentials(null);
    try {
      const credentials = await apiRequest<StudentCredentials>(
        `/schools/${encodeURIComponent(schoolSlug)}/people/students/${encodeURIComponent(studentId)}/credentials`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({}),
        },
      );
      setIssuedCredentials(credentials);
      setNotice(`Sign-in credentials issued for ${credentials.student.firstName} ${credentials.student.lastName}.`);
      await loadPeople(session.access_token);
    } catch (issueError) {
      setError(issueError instanceof Error ? issueError.message : "Could not issue student sign-in.");
    } finally {
      setBusy("");
    }
  }

  async function retryInvitation(membershipId: string) {
    if (!session) return;
    setBusy(membershipId);
    setError("");
    setNotice("");
    try {
      await apiRequest(
        `/schools/${encodeURIComponent(schoolSlug)}/people/teachers/${membershipId}/invite`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({}),
        },
      );
      setNotice("Teacher invitation sent");
      await loadPeople(session.access_token);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Could not resend teacher invitation.");
    } finally {
      setBusy("");
    }
  }

  if (!supabase) {
    return <PeopleMessage title="Sign-in is not configured" message="Set the public Supabase URL and publishable key for this app before managing school people." />;
  }
  if (authLoading || loading && !people) {
    return <PeopleMessage title="Loading people and classes" message="Checking your administrator access…" />;
  }
  if (!session) {
    return (
      <PeopleMessage title="Sign in to continue" message="People and class rosters are only available to an active administrator of this school.">
        <Link className="setup-button" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin`}>Go to administrator sign-in</Link>
      </PeopleMessage>
    );
  }
  if (!people) {
    return (
      <PeopleMessage title="Could not open people and classes" message={error || "Your account may not have administrator access to this school."}>
        <button className="setup-button" onClick={() => void loadPeople(session.access_token)} type="button">Try again</button>
        <button className="setup-link-button" onClick={() => void supabase.auth.signOut()} type="button">Sign out</button>
      </PeopleMessage>
    );
  }

  const activeTeachers = people.teachers.filter((teacher) => teacher.status === "ACTIVE");
  const enrolledCount = people.students.length;

  return (
    <main className="school-setup-page school-people-page">
      <header className="school-setup-header">
        <div>
          <Link className="setup-back-link" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/dashboard`}>← Administrator dashboard</Link>
          <p className="setup-eyebrow">SCHOOL ADMINISTRATOR · PEOPLE</p>
          <h1>People & class rosters</h1>
          <p className="setup-intro">Invite teachers, enrol students into the shared class structure, and connect teachers to subject offerings.</p>
        </div>
        <div className="setup-header-actions">
          <ThemeToggle />
          <div className="setup-progress"><strong>{people.students.length + people.teachers.length}</strong><span>people records</span></div>
        </div>
      </header>

      {error ? <div className="setup-notice setup-notice-error" role="alert">{error}</div> : null}
      {notice ? <div className="setup-notice setup-notice-success" role="status">{notice}</div> : null}
      {issuedCredentials ? (
        <section className="student-credentials-notice" aria-label="One-time student sign-in credentials">
          <div>
            <span className="setup-eyebrow">SHARE THESE ONCE</span>
            <h2>{issuedCredentials.student.firstName} {issuedCredentials.student.lastName}</h2>
            <p>Give the student these sign-in details directly. The temporary password is shown only in this session.</p>
          </div>
          <dl>
            <div><dt>Student ID</dt><dd>{issuedCredentials.loginId}</dd></div>
            <div><dt>Temporary password</dt><dd>{issuedCredentials.temporaryPassword}</dd></div>
          </dl>
          <button
            className="people-inline-button student-credentials-hide"
            onClick={() => setIssuedCredentials(null)}
            type="button"
          >
            Hide credentials
          </button>
        </section>
      ) : null}

      <div className="school-people-summary" aria-label="People overview">
        <article><span>Students enrolled</span><strong>{enrolledCount.toLocaleString()}</strong></article>
        <article><span>Teachers</span><strong>{people.teachers.length.toLocaleString()}</strong></article>
        <article><span>Class groups</span><strong>{people.classArms.length.toLocaleString()}</strong></article>
        <article><span>Teacher assignments</span><strong>{people.teacherAssignments.length.toLocaleString()}</strong></article>
      </div>

      <div className="setup-grid school-people-forms">
        <section className="setup-card">
          <div className="setup-card-heading"><span>01</span><div><h2>Invite a teacher</h2><p>Send a secure sign-in invitation to a teacher.</p></div></div>
          <form onSubmit={inviteTeacher}>
            <label>Teacher email<input name="email" type="email" maxLength={254} placeholder="teacher@school.org" required /></label>
            <p className="people-form-note">The teacher’s account is activated when they accept and verify their invited email address.</p>
            <button className="setup-button" disabled={busy === "Teacher invitation sent"} type="submit">{busy === "Teacher invitation sent" ? "Sending…" : "Send invitation"}</button>
          </form>
        </section>

        <section className="setup-card">
          <div className="setup-card-heading"><span>02</span><div><h2>Enrol a student</h2><p>Add a student to a class group in its academic year.</p></div></div>
          <form onSubmit={createStudent}>
            <div className="setup-field-row"><label>First name<input name="firstName" maxLength={80} required /></label><label>Last name<input name="lastName" maxLength={80} required /></label></div>
            <label>Student number <small>Optional</small><input name="studentNumber" maxLength={40} /></label>
            <label>Class group<select name="classArmId" required defaultValue=""><option value="" disabled>Select a class group</option>{people.classArms.map((arm) => <option key={arm.id} value={arm.id}>{arm.grade.name} {arm.name} · {arm.academicYear.name}</option>)}</select></label>
            <p className="people-form-note">After enrolment, issue a school Student ID and temporary password from the class roster. Students set a new password at first sign-in.</p>
            <button className="setup-button" disabled={busy === "Student enrolled" || !people.classArms.length} type="submit">{busy === "Student enrolled" ? "Enrolling…" : "Add to class roster"}</button>
          </form>
        </section>

        <section className="setup-card">
          <div className="setup-card-heading"><span>03</span><div><h2>Assign a teacher</h2><p>Connect an active teacher to a class subject and term.</p></div></div>
          <form onSubmit={assignTeacher}>
            <label>Teacher<select name="teacherMembershipId" required defaultValue=""><option value="" disabled>Select an active teacher</option>{activeTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.email}</option>)}</select></label>
            <label>Subject offering<select name="subjectOfferingId" required defaultValue=""><option value="" disabled>Select a class subject</option>{people.subjectOfferings.map((offering) => <option key={offering.id} value={offering.id}>{offering.classArm.grade.name} {offering.classArm.name} · {offering.subject.name} · {offering.term.academicYear.name} {offering.term.name}</option>)}</select></label>
            <button className="setup-button" disabled={busy === "Teacher assigned" || !activeTeachers.length || !people.subjectOfferings.length} type="submit">{busy === "Teacher assigned" ? "Assigning…" : "Assign teacher"}</button>
          </form>
        </section>
      </div>

      <div className="setup-grid school-people-lists">
        <section className="setup-card">
          <div className="setup-card-heading"><span>04</span><div><h2>Teachers</h2><p>Invitation status and teaching assignments.</p></div></div>
          {people.teachers.length ? (
            <ul className="people-record-list">{people.teachers.map((teacher) => (
              <li key={teacher.id}>
                <div className="people-record-copy"><strong>{teacher.email}</strong><span className={`people-status people-status-${teacher.status.toLowerCase()}`}>{teacherStatus(teacher.status)}</span></div>
                {teacher.status === "INVITE_FAILED" ? <button className="people-inline-button" disabled={busy === teacher.id} onClick={() => void retryInvitation(teacher.id)} type="button">{busy === teacher.id ? "Sending…" : "Resend invite"}</button> : null}
              </li>
            ))}</ul>
          ) : <p className="people-empty-state">No teachers have been invited yet.</p>}
        </section>

        <section className="setup-card">
          <div className="setup-card-heading"><span>05</span><div><h2>Teacher assignments</h2><p>Teachers linked to class subject offerings.</p></div></div>
          {people.teacherAssignments.length ? (
            <ul className="people-record-list">{people.teacherAssignments.map((assignment) => (
              <li key={assignment.id}>
                <div className="people-record-copy">
                  <strong>{assignment.teacher.email}</strong>
                  <small>{assignment.subjectOffering.classArm.grade.name} {assignment.subjectOffering.classArm.name} · {assignment.subjectOffering.subject.name}</small>
                  <small>{assignment.subjectOffering.term.academicYear.name} · {assignment.subjectOffering.term.name}</small>
                </div>
                <button className="people-inline-button people-remove-button" disabled={busy === assignment.id} onClick={() => void removeAssignment(assignment.id)} type="button">{busy === assignment.id ? "Removing…" : "Remove"}</button>
              </li>
            ))}</ul>
          ) : <p className="people-empty-state">No teacher assignments yet. Assign an active teacher to a subject offering above.</p>}
        </section>

        <section className="setup-card school-rosters-card">
          <div className="setup-card-heading"><span>06</span><div><h2>Class rosters</h2><p>Students enrolled in each class group.</p></div></div>
          {people.classArms.length ? (
            <div className="school-roster-list">{people.classArms.map((arm) => {
              const students = people.students.filter((student) =>
                student.enrollments.some((enrollment) =>
                  enrollment.classArm.id === arm.id && enrollment.academicYear.id === arm.academicYear.id,
                ),
              );
              return (
                <section className="school-roster" key={arm.id}>
                  <div className="school-roster-heading"><div><strong>{arm.grade.name} · {arm.name}</strong><small>{arm.academicYear.name} · {arm.campus.name}</small></div><span>{students.length} students</span></div>
                  {students.length ? <ul>{students.map((student) => (
                    <li key={student.id}>
                      <div className="school-roster-student">
                        <span>{student.firstName} {student.lastName}</span>
                        <small>{student.studentNumber || "No school student number"}</small>
                        {student.loginId ? <small>Student ID: {student.loginId}</small> : null}
                      </div>
                      <button
                        className="people-inline-button"
                        disabled={
                          busy === student.id ||
                          people.school.status !== "ACTIVE" ||
                          student.loginMembership?.status === "INVITE_SENDING"
                        }
                        onClick={() => void issueStudentCredentials(student.id)}
                        type="button"
                      >
                        {busy === student.id
                          ? "Issuing…"
                          : people.school.status !== "ACTIVE"
                            ? "Available when active"
                            : student.loginMembership?.status === "ACTIVE"
                            ? "Reset password"
                            : student.loginMembership?.status === "INVITE_FAILED"
                              ? "Retry login"
                              : "Issue login"}
                      </button>
                    </li>
                  ))}</ul> : <p>No students enrolled in this class group yet.</p>}
                </section>
              );
            })}</div>
          ) : <p className="people-empty-state">Set up class groups before enrolling students.</p>}
        </section>
      </div>

      <footer className="school-setup-footer">
        <Link className="setup-link-button" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin/setup`}>Manage school structure</Link>
        <button className="setup-link-button" onClick={() => void supabase.auth.signOut()} type="button">Sign out</button>
      </footer>
    </main>
  );
}
