"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ThemeToggle } from "@smartschools/ui/theme-toggle";
import type { Session } from "@supabase/supabase-js";
import { apiRequest } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SetupData = {
  school: { id: string; name: string; slug: string; status: "ONBOARDING" | "ACTIVE" };
  campuses: { id: string; name: string; code: string | null; address: string | null; isMainSite: boolean }[];
  academicYears: { id: string; name: string; startsOn: string; endsOn: string; status: string; terms: { id: string; name: string; startsOn: string; endsOn: string; order: number }[] }[];
  grades: { id: string; name: string; displayOrder: number }[];
  classArms: { id: string; name: string; campus: { id: string; name: string }; academicYear: { id: string; name: string }; grade: { id: string; name: string } }[];
  subjects: { id: string; name: string; code: string | null }[];
  subjectOfferings: { id: string; subject: { id: string; name: string; code: string | null }; classArm: { id: string; name: string; grade: { name: string } }; term: { id: string; name: string; academicYear: { name: string } } }[];
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export function SchoolSetupWorkspace({ schoolSlug }: { schoolSlug: string }) {
  const [supabase] = useState(getSupabaseBrowserClient);
  const [session, setSession] = useState<Session | null>(null);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSetup = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<SetupData>(`/schools/${encodeURIComponent(schoolSlug)}/setup`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      setSetup(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load school setup.");
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
      if (data.session) void loadSetup(data.session.access_token);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSetup(null);
      setError("");
      if (nextSession) void loadSetup(nextSession.access_token);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadSetup, supabase]);

  async function save(path: string, payload: Record<string, string | boolean | number>, event: FormEvent<HTMLFormElement>, label: string) {
    event.preventDefault();
    if (!session) return;
    const form = event.currentTarget;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/schools/${encodeURIComponent(schoolSlug)}/setup/${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      setNotice(`${label} saved.`);
      await loadSetup(session.access_token);
      form.reset();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `Could not save ${label.toLocaleLowerCase()}.`);
    } finally {
      setBusy("");
    }
  }

  if (!supabase) {
    return <SetupMessage title="Sign-in is not configured" message="Set the public Supabase URL and publishable key for this app before using school setup." />;
  }
  if (authLoading || loading && !setup) {
    return <SetupMessage title="Loading school setup" message="Checking your administrator access…" />;
  }
  if (!session) {
    return <SetupMessage title="Sign in to continue" message="School setup is only available to an active administrator of this school.">
      <Link className="setup-button" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin`}>Go to administrator sign-in</Link>
    </SetupMessage>;
  }
  if (!setup) {
    return <SetupMessage title="Could not open school setup" message={error || "Your account may not have administrator access to this school."}>
      <button className="setup-button" onClick={() => void loadSetup(session.access_token)} type="button">Try again</button>
      <button className="setup-link-button" onClick={() => void supabase.auth.signOut()} type="button">Sign out</button>
    </SetupMessage>;
  }

  const terms = setup.academicYears.flatMap((year) => year.terms.map((term) => ({ ...term, yearName: year.name })));
  const doneCount = [setup.campuses.length, setup.academicYears.length, setup.grades.length, setup.classArms.length, setup.subjects.length, setup.subjectOfferings.length].filter((count) => count > 0).length;

  return (
    <main className="school-setup-page">
      <header className="school-setup-header">
        <div>
          <Link className="setup-back-link" href={`/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin`}>← Administrator access</Link>
          <p className="setup-eyebrow">SCHOOL ADMINISTRATOR · SCHOOL FOUNDATION</p>
          <h1>Set up {setup.school.name}</h1>
          <p className="setup-intro">Add the structure your school will use for classes, curriculum and teaching.</p>
        </div>
        <div className="setup-header-actions">
          <ThemeToggle />
          <div className="setup-progress"><strong>{doneCount} of 6</strong><span>foundations started</span></div>
        </div>
      </header>

      {error ? <div className="setup-notice setup-notice-error" role="alert">{error}</div> : null}
      {notice ? <div className="setup-notice setup-notice-success" role="status">{notice}</div> : null}

      <div className="setup-grid">
        <section className="setup-card">
          <div className="setup-card-heading"><span>01</span><div><h2>Campuses</h2><p>Where learning takes place.</p></div></div>
          <form onSubmit={(event) => void save("campuses", {
            name: String(new FormData(event.currentTarget).get("name") ?? ""),
            code: String(new FormData(event.currentTarget).get("code") ?? ""),
            address: String(new FormData(event.currentTarget).get("address") ?? ""),
            isMainSite: new FormData(event.currentTarget).get("isMainSite") === "on",
          }, event, "Campus")}>
            <label>Campus name<input name="name" minLength={2} maxLength={100} placeholder="e.g. Main campus" required /></label>
            <label>Campus code <small>Optional</small><input name="code" maxLength={24} placeholder="e.g. MAIN" /></label>
            <label>Address <small>Optional</small><input name="address" maxLength={240} placeholder="Street, city" /></label>
            <label className="setup-checkbox"><input name="isMainSite" type="checkbox" /> This is the main campus</label>
            <button className="setup-button" disabled={busy === "Campus"} type="submit">{busy === "Campus" ? "Saving…" : "Add campus"}</button>
          </form>
          <ul className="setup-record-list">{setup.campuses.map((campus) => <li key={campus.id}><strong>{campus.name}</strong>{campus.isMainSite ? <span>Main</span> : null}<small>{campus.code || campus.address || "Campus"}</small></li>)}</ul>
        </section>

        <section className="setup-card">
          <div className="setup-card-heading"><span>02</span><div><h2>Academic years</h2><p>Define the school year and its terms.</p></div></div>
          <form onSubmit={(event) => void save("academic-years", {
            name: String(new FormData(event.currentTarget).get("name") ?? ""),
            startsOn: String(new FormData(event.currentTarget).get("startsOn") ?? ""),
            endsOn: String(new FormData(event.currentTarget).get("endsOn") ?? ""),
          }, event, "Academic year")}>
            <label>Year name<input name="name" maxLength={80} placeholder="e.g. 2026/2027" required /></label>
            <div className="setup-field-row"><label>Starts<input name="startsOn" type="date" required /></label><label>Ends<input name="endsOn" type="date" required /></label></div>
            <button className="setup-button" disabled={busy === "Academic year"} type="submit">{busy === "Academic year" ? "Saving…" : "Add academic year"}</button>
          </form>
          <ul className="setup-record-list">{setup.academicYears.map((year) => <li className="setup-year-record" key={year.id}>
            <strong>{year.name}</strong><small>{dateLabel(year.startsOn)} – {dateLabel(year.endsOn)}</small>
            <ul>{year.terms.map((term) => <li key={term.id}>{term.name}<small>{dateLabel(term.startsOn)} – {dateLabel(term.endsOn)}</small></li>)}</ul>
            <form className="setup-inline-form" onSubmit={(event) => void save(`academic-years/${year.id}/terms`, {
              name: String(new FormData(event.currentTarget).get("name") ?? ""),
              startsOn: String(new FormData(event.currentTarget).get("startsOn") ?? ""),
              endsOn: String(new FormData(event.currentTarget).get("endsOn") ?? ""),
              order: year.terms.length + 1,
            }, event, "Term")}>
              <label>Term name<input name="name" maxLength={80} placeholder="e.g. First term" required /></label>
              <div className="setup-field-row"><label>Starts<input name="startsOn" type="date" required /></label><label>Ends<input name="endsOn" type="date" required /></label></div>
              <button className="setup-button setup-button-small" disabled={busy === "Term"} type="submit">Add term</button>
            </form>
          </li>)}</ul>
        </section>

        <section className="setup-card">
          <div className="setup-card-heading"><span>03</span><div><h2>Grades</h2><p>Organise the levels your school teaches.</p></div></div>
          <form onSubmit={(event) => void save("grades", {
            name: String(new FormData(event.currentTarget).get("name") ?? ""),
            displayOrder: Number(new FormData(event.currentTarget).get("displayOrder") ?? 0),
          }, event, "Grade")}>
            <label>Grade name<input name="name" maxLength={80} placeholder="e.g. Primary 1" required /></label>
            <label>Display order<input name="displayOrder" type="number" min={0} max={100} defaultValue={setup.grades.length + 1} /></label>
            <button className="setup-button" disabled={busy === "Grade"} type="submit">{busy === "Grade" ? "Saving…" : "Add grade"}</button>
          </form>
          <ul className="setup-record-list">{setup.grades.map((grade) => <li key={grade.id}><strong>{grade.name}</strong><small>Order {grade.displayOrder}</small></li>)}</ul>
        </section>

        <section className="setup-card" id="class-arms">
          <div className="setup-card-heading"><span>04</span><div><h2>Class arms</h2><p>Create classes for each year and campus.</p></div></div>
          <form onSubmit={(event) => void save("class-arms", {
            campusId: String(new FormData(event.currentTarget).get("campusId") ?? ""),
            academicYearId: String(new FormData(event.currentTarget).get("academicYearId") ?? ""),
            gradeId: String(new FormData(event.currentTarget).get("gradeId") ?? ""),
            name: String(new FormData(event.currentTarget).get("name") ?? ""),
          }, event, "Class arm")}>
            <label>Campus<select name="campusId" required defaultValue=""><option value="" disabled>Select a campus</option>{setup.campuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Academic year<select name="academicYearId" required defaultValue=""><option value="" disabled>Select a year</option>{setup.academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Grade<select name="gradeId" required defaultValue=""><option value="" disabled>Select a grade</option>{setup.grades.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Class arm name<input name="name" maxLength={40} placeholder="e.g. Blue" required /></label>
            <button className="setup-button" disabled={busy === "Class arm" || !setup.campuses.length || !setup.academicYears.length || !setup.grades.length} type="submit">{busy === "Class arm" ? "Saving…" : "Add class arm"}</button>
          </form>
          <ul className="setup-record-list">{setup.classArms.map((arm) => <li key={arm.id}><strong>{arm.grade.name} · {arm.name}</strong><small>{arm.academicYear.name} · {arm.campus.name}</small></li>)}</ul>
        </section>

        <section className="setup-card">
          <div className="setup-card-heading"><span>05</span><div><h2>Subjects</h2><p>Build your school’s subject catalogue.</p></div></div>
          <form onSubmit={(event) => void save("subjects", {
            name: String(new FormData(event.currentTarget).get("name") ?? ""),
            code: String(new FormData(event.currentTarget).get("code") ?? ""),
          }, event, "Subject")}>
            <label>Subject name<input name="name" maxLength={100} placeholder="e.g. Mathematics" required /></label>
            <label>Subject code <small>Optional</small><input name="code" maxLength={24} placeholder="e.g. MATH" /></label>
            <button className="setup-button" disabled={busy === "Subject"} type="submit">{busy === "Subject" ? "Saving…" : "Add subject"}</button>
          </form>
          <ul className="setup-record-list">{setup.subjects.map((subject) => <li key={subject.id}><strong>{subject.name}</strong><small>{subject.code || "Subject"}</small></li>)}</ul>
        </section>

        <section className="setup-card">
          <div className="setup-card-heading"><span>06</span><div><h2>Offer subjects</h2><p>Connect subjects to a class and term.</p></div></div>
          <form onSubmit={(event) => void save("subject-offerings", {
            classArmId: String(new FormData(event.currentTarget).get("classArmId") ?? ""),
            subjectId: String(new FormData(event.currentTarget).get("subjectId") ?? ""),
            termId: String(new FormData(event.currentTarget).get("termId") ?? ""),
          }, event, "Subject offering")}>
            <label>Class arm<select name="classArmId" required defaultValue=""><option value="" disabled>Select a class</option>{setup.classArms.map((item) => <option key={item.id} value={item.id}>{item.grade.name} {item.name} · {item.academicYear.name}</option>)}</select></label>
            <label>Subject<select name="subjectId" required defaultValue=""><option value="" disabled>Select a subject</option>{setup.subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Term<select name="termId" required defaultValue=""><option value="" disabled>Select a term</option>{terms.map((item) => <option key={item.id} value={item.id}>{item.yearName} · {item.name}</option>)}</select></label>
            <button className="setup-button" disabled={busy === "Subject offering" || !setup.classArms.length || !setup.subjects.length || !terms.length} type="submit">{busy === "Subject offering" ? "Saving…" : "Offer subject"}</button>
          </form>
          <ul className="setup-record-list">{setup.subjectOfferings.map((offering) => <li key={offering.id}><strong>{offering.subject.name}</strong><small>{offering.classArm.grade.name} {offering.classArm.name} · {offering.term.academicYear.name} {offering.term.name}</small></li>)}</ul>
        </section>
      </div>
      <footer className="school-setup-footer"><span>{setup.school.status === "ONBOARDING" ? "School onboarding" : "School active"}</span><button className="setup-link-button" onClick={() => void supabase.auth.signOut()} type="button">Sign out</button></footer>
    </main>
  );
}

function SetupMessage({ title, message, children }: { title: string; message: string; children?: ReactNode }) {
  return <main className="school-setup-page"><section className="setup-message"><span className="setup-eyebrow">SMARTSCHOOLS · SCHOOL ADMIN</span><h1>{title}</h1><p>{message}</p>{children}</section></main>;
}
