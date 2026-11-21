import Link from "next/link";
import { OnboardingPreview } from "@/features/schools/onboarding-preview";

export const metadata = {
  title: "Set up your school | SmartSchools",
  description: "Preview the guided school setup and onboarding process.",
};

export default function NewSchoolPage() {
  return (
    <main className="school-onboarding-page">
      <header className="portal-page-header">
        <div className="header-inner">
          <Link className="wordmark" href="/" aria-label="SmartSchools home">
            <span className="brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
            <span>smart<span className="wordmark-strong">schools</span></span>
          </Link>
          <Link className="text-link" href="/schools">Find your school <span aria-hidden="true">↗</span></Link>
        </div>
      </header>
      <section className="school-onboarding-main">
        <div className="onboarding-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> School onboarding</span>
          <h1>Give your school<br /><span>a connected start.</span></h1>
        </div>
        <OnboardingPreview />
      </section>
    </main>
  );
}
