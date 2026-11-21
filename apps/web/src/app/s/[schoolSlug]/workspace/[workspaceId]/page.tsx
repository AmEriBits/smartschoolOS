import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchoolBySlug, schools } from "@/lib/schools";
import { getWorkspace, workspaces } from "@/lib/workspaces";

type Props = {
  params: Promise<{ schoolSlug: string; workspaceId: string }>;
};

export const instant = false;

export function generateStaticParams() {
  return schools.flatMap((school) =>
    workspaces.map((workspace) => ({
      schoolSlug: school.slug,
      workspaceId: workspace.id,
    })),
  );
}

export default async function WorkspaceSignInPage({ params }: Props) {
  const { schoolSlug, workspaceId } = await params;
  const school = getSchoolBySlug(schoolSlug);
  const workspace = getWorkspace(workspaceId);
  if (!school || !workspace) notFound();

  return (
    <main className="school-sign-in">
      <section className="sign-in-brand-panel">
        <Link className="wordmark wordmark-light" href="/" aria-label="SmartSchools home">
          <span className="brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>smart<span className="wordmark-strong">schools</span></span>
        </Link>
        <div className="sign-in-brand-copy">
          <span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> {school.location}</span>
          <div className={`tenant-logo tenant-logo-${school.accent}`}>{school.initials}</div>
          <h1>{school.name}</h1>
          <p>A school community, connected.</p>
          <div className="sign-in-orbit" aria-hidden="true"><span /><span /><span /></div>
        </div>
        <span className="sign-in-brand-footer">A thoughtful space for learning and school life.</span>
      </section>

      <section className="sign-in-panel">
        <Link className="sign-in-back" href={`/s/${school.slug}`}>← Back to workspaces</Link>
        <div className="sign-in-content">
          <span className="eyebrow">Your {workspace.label.toLocaleLowerCase()} workspace</span>
          <h2>Good to see you.</h2>
          <p className="sign-in-intro">Sign in to your {school.name} workspace.</p>
          <div className="sign-in-access-card">
            <span className="sign-in-access-icon">✳</span>
            <div>
              <strong>Secure access is the next step</strong>
              <p>
                This preview does not accept passwords. Account sign-in will be enabled
                after school membership and identity services are connected.
              </p>
            </div>
          </div>
          <button className="button button-dark sign-in-disabled" disabled type="button">
            Secure sign-in coming soon <span aria-hidden="true">→</span>
          </button>
          <div className="sign-in-divider"><span>School code</span></div>
          <div className="sign-in-school-code">
            <span>{school.schoolCode}</span>
            <small>A school identifier, not a password</small>
          </div>
          <p className="sign-in-security-note"><span aria-hidden="true">♢</span> Your school verifies access to every workspace.</p>
        </div>
      </section>
    </main>
  );
}
