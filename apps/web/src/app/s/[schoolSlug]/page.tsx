import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@smartschools/ui/theme-toggle";
import { getSchoolBySlug, getSchoolInitials } from "@/lib/schools";
import { workspaces } from "@/lib/workspaces";

type Props = {
  params: Promise<{ schoolSlug: string }>;
};

export const instant = false;

export async function generateMetadata({ params }: Props) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  return {
    title: school ? `${school.name} | SmartSchools` : "School workspace | SmartSchools",
  };
}

export default async function SchoolWorkspacePage({ params }: Props) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();
  const initials = getSchoolInitials(school.name);
  const accent = school.slug.charCodeAt(0) % 2 ? "blue" : "green";

  return (
    <main className="tenant-page">
      <header className="tenant-header">
        <div className="tenant-header-inner">
          <Link className="wordmark" href="/" aria-label="SmartSchools home">
            <span className="brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
            <span>smart<span className="wordmark-strong">schools</span></span>
          </Link>
          <span className="tenant-header-context">School workspace</span>
          <div className="tenant-header-actions">
            <ThemeToggle />
            <Link className="tenant-switch-link" href="/schools">Change school <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </header>

      <section className="tenant-main">
        <Link className="portal-back" href="/schools">
          <span aria-hidden="true">←</span> All schools
        </Link>
        <div className="tenant-identity">
          <div className={`tenant-logo tenant-logo-${accent}`}>{initials}</div>
          <div>
            <span className="eyebrow">Welcome to your school</span>
            <h1>{school.name}</h1>
            <p>{school.location} <span>·</span> School code <strong>{school.schoolCode}</strong></p>
          </div>
        </div>

        <div className="tenant-workspace-heading">
          <div>
            <span className="eyebrow">Choose your workspace</span>
            <h2>How do you use {school.name}?</h2>
          </div>
          <p>Your role and school membership are verified when you sign in.</p>
        </div>
        <div className="tenant-workspace-grid">
          {workspaces.map((workspace, index) => (
            <Link
              className={`tenant-workspace-card tenant-workspace-${workspace.tone}`}
              href={`/s/${school.slug}/workspace/${workspace.id}`}
              key={workspace.id}
            >
              <span className="tenant-workspace-icon">{workspace.icon}</span>
              <span className="tenant-workspace-number">0{index + 1}</span>
              <h3>{workspace.label}</h3>
              <p>{workspace.description}</p>
              <span className="tenant-workspace-action">Continue <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
        <div className="tenant-transport-note">
          <span>↗</span>
          <p>
            School transport teams use a school-enabled operations workspace. Ask your
            school administrator if transport access is available.
          </p>
        </div>
        <p className="tenant-preview-note">
          School membership is checked before access. School records and operational workspaces will be introduced in later phases.
        </p>
      </section>
    </main>
  );
}
