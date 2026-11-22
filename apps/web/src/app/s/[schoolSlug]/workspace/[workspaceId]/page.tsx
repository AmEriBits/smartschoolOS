import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceSignIn } from "@/features/schools/workspace-sign-in";
import { getSchoolBySlug, getSchoolInitials } from "@/lib/schools";
import { getWorkspace } from "@/lib/workspaces";

type Props = {
  params: Promise<{ schoolSlug: string; workspaceId: string }>;
};

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { workspaceId } = await params;
  const workspace = getWorkspace(workspaceId);
  return {
    title: workspace ? `${workspace.label} sign in | SmartSchools` : "School sign in | SmartSchools",
  };
}

export default async function WorkspaceSignInPage({ params }: Props) {
  const { schoolSlug, workspaceId } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  const workspace = getWorkspace(workspaceId);
  if (!workspace) notFound();
  const initials = school ? getSchoolInitials(school.name) : "SS";
  const accent = school && school.slug.charCodeAt(0) % 2 ? "blue" : "green";

  return (
    <main className="school-sign-in">
      <section className="sign-in-brand-panel">
        <Link className="wordmark wordmark-light" href="/" aria-label="SmartSchools home">
          <span className="brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>smart<span className="wordmark-strong">schools</span></span>
        </Link>
        <div className="sign-in-brand-copy">
          <span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> {school?.location ?? "Secure school access"}</span>
          <div className={`tenant-logo tenant-logo-${accent}`}>{initials}</div>
          <h1>{school?.name ?? "Your school"}</h1>
          <p>A school community, connected.</p>
          <div className="sign-in-orbit" aria-hidden="true"><span /><span /><span /></div>
        </div>
        <span className="sign-in-brand-footer">A thoughtful space for learning and school life.</span>
      </section>

      <section className="sign-in-panel">
        <Link className="sign-in-back" href={school ? `/s/${school.slug}` : "/schools"}>
          ← {school ? "Back to workspaces" : "Find your school"}
        </Link>
        <div className="sign-in-content">
          <span className="eyebrow">Your {workspace.label.toLocaleLowerCase()} workspace</span>
          <h2>Good to see you.</h2>
          <p className="sign-in-intro">
            Sign in to {school ? `${school.name}’s` : "your school"} workspace. Membership is verified before access.
          </p>
          <WorkspaceSignIn school={school} schoolSlug={schoolSlug} workspace={workspace} />
          <div className="sign-in-divider"><span>School code</span></div>
          {school ? (
            <div className="sign-in-school-code">
              <span>{school.schoolCode}</span>
              <small>A school identifier, not a password</small>
            </div>
          ) : (
            <p className="sign-in-security-note">A private school’s details are shown only after membership is verified.</p>
          )}
          <p className="sign-in-security-note"><span aria-hidden="true">♢</span> Your school verifies access to every workspace.</p>
        </div>
      </section>
    </main>
  );
}
