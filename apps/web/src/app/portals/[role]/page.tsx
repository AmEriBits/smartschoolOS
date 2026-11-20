import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isPortalRole, portalData } from "@/lib/portal-data";

type Props = {
  params: Promise<{ role: string }>;
};

export function generateStaticParams() {
  return Object.keys(portalData).map((role) => ({ role }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role } = await params;
  if (!isPortalRole(role)) return {};

  const portal = portalData[role];
  return {
    title: `${portal.label} | SmartSchools`,
    description: portal.intro,
  };
}

export default async function PortalPage({ params }: Props) {
  const { role } = await params;
  if (!isPortalRole(role)) notFound();

  const portal = portalData[role];

  return (
    <main className="portal-page">
      <header className="portal-page-header">
        <div className="header-inner">
          <Link className="wordmark" href="/" aria-label="SmartSchools home">
            <span className="brand-symbol" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span>smart<span className="wordmark-strong">schools</span></span>
          </Link>
          <Link className="button button-dark header-cta" href="/portals">
            All workspaces <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>
      <div className="portal-page-main">
        <Link className="portal-back" href="/">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
            <path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to SmartSchools
        </Link>
        <div className="portal-preview-label"><span /> {portal.label} · Product preview</div>
        <h1>{portal.title}</h1>
        <p className="portal-page-intro">{portal.intro}</p>
        <h2 className="portal-module-title">{portal.focus}</h2>
        <div className="portal-module-grid">
          {portal.modules.map((module, index) => (
            <article className="portal-module" key={module.title}>
              <h2><span className="portal-module-number">0{index + 1}</span>{module.title}</h2>
              <p>{module.description}</p>
            </article>
          ))}
        </div>
        <div className="portal-next-step">
          <span aria-hidden="true">✳</span>
          <div>
            <strong>This workspace is taking shape</strong>
            This first preview maps the experience. Secure sign-in, permissions and live school data will be added as the platform is built.
          </div>
        </div>
        <div className="portal-page-footer">
          SmartSchools · A connected school experience, built in thoughtful stages.
        </div>
      </div>
    </main>
  );
}
