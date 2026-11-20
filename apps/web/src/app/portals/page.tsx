import Link from "next/link";

const workspaces = [
  {
    href: "/portals/school-admin",
    title: "School admin",
    description: "Set up your school and connect academics, teaching and operations.",
    icon: "⌂",
    className: "portal-mint",
  },
  {
    href: "/portals/student",
    title: "Student",
    description: "Learn at your pace with a personal view of progress and practice.",
    icon: "✳",
    className: "portal-lavender",
  },
  {
    href: "/portals/family",
    title: "Family",
    description: "Follow each child’s school journey and stay connected.",
    icon: "♡",
    className: "portal-peach",
  },
];

export default function PortalsPage() {
  return (
    <main className="portal-page">
      <header className="portal-page-header">
        <div className="header-inner">
          <Link className="wordmark" href="/" aria-label="SmartSchools home">
            <span className="brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
            <span>smart<span className="wordmark-strong">schools</span></span>
          </Link>
          <Link className="text-link" href="/">Back to homepage <span aria-hidden="true">↗</span></Link>
        </div>
      </header>
      <section className="portal-page-main">
        <div className="portal-preview-label"><span /> Connected school community</div>
        <h1>Find your workspace.</h1>
        <p className="portal-page-intro">
          A shared foundation, with a more useful view for everyone who makes school work.
        </p>
        <div className="workspace-grid">
          {workspaces.map((workspace) => (
            <Link className={`workspace-card ${workspace.className}`} href={workspace.href} key={workspace.title}>
              <span className="workspace-icon" aria-hidden="true">{workspace.icon}</span>
              <h2>{workspace.title}</h2>
              <p>{workspace.description}</p>
              <span className="workspace-link">Explore preview <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
        <p className="preview-disclaimer">
          These are product previews, not sign-in pages. Authentication and live school records are planned for later stages.
        </p>
      </section>
    </main>
  );
}
