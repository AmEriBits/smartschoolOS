import Link from "next/link";
import { SchoolDirectory } from "@/features/schools/school-directory";

export const metadata = {
  title: "Find your school | SmartSchools",
  description: "Find your school’s SmartSchools workspace or start a school setup.",
};

export default function SchoolsPage() {
  return (
    <main className="school-entry-page">
      <header className="portal-page-header">
        <div className="header-inner">
          <Link className="wordmark" href="/" aria-label="SmartSchools home">
            <span className="brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
            <span>smart<span className="wordmark-strong">schools</span></span>
          </Link>
          <Link className="button button-dark header-cta" href="/schools/new">
            Set up your school <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <section className="school-entry-main">
        <div className="school-entry-copy">
          <div className="portal-preview-label"><span /> Your school, one shared space</div>
          <h1>Find your<br /><span>school community.</span></h1>
          <p>
            Choose your school to reach its branded workspace. Teachers, students and
            families sign in through the school they belong to.
          </p>
        </div>

        <div className="school-directory-panel">
          <div className="directory-panel-heading">
            <div>
              <span className="eyebrow">School directory</span>
              <h2>Where do you learn or teach?</h2>
            </div>
            <span className="directory-lock" title="School membership is verified at sign-in">⌑</span>
          </div>
          <SchoolDirectory />
          <div className="directory-private-note">
            <span aria-hidden="true">✳</span>
            <p>
              Don’t see your school? It may be private. Ask your school administrator for
              its unique school code or <Link href="/schools/new">start a school setup</Link>.
            </p>
          </div>
        </div>

        <div className="school-entry-foot">
          <span>School access is always verified</span>
          <span>School codes identify a school—they are not passwords.</span>
        </div>
      </section>
    </main>
  );
}
