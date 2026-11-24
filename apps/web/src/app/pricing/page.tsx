import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@smartschools/ui/theme-toggle";

export const metadata: Metadata = {
  title: "Pricing | SmartSchools",
  description:
    "Compare proposed SmartSchools packages for school operations, teaching, learning and school groups.",
};

const plans = [
  {
    name: "Smart Start",
    label: "A strong digital foundation",
    description: "For schools ready to bring their core records and everyday administration together.",
    price: "₦2,500,000",
    badge: "START HERE",
    highlights: [
      ["School workspace and administrator dashboard", "Available"],
      ["Academic setup, classes and people records", "Available"],
      ["Admissions, attendance and fee workflows", "Planned"],
      ["One attendance terminal in the proposed package", "Proposed"],
    ],
  },
  {
    name: "Smart Advance",
    label: "More insight for teaching",
    description: "For established schools preparing to add learning intelligence and teacher tools.",
    price: "₦3,500,000",
    badge: "GROW WITH INSIGHT",
    highlights: [
      ["Everything in Smart Start", "Included"],
      ["Teacher lesson and assessment assistance", "Planned"],
      ["Learning progress and performance insights", "Planned"],
      ["Up to two attendance terminals in the proposed package", "Proposed"],
    ],
  },
  {
    name: "Smart Elite",
    label: "A connected school vision",
    description: "For ambitious schools looking toward deeper AI support and multi-campus operations.",
    price: "₦5,000,000",
    badge: "RECOMMENDED",
    highlights: [
      ["Everything in Smart Advance", "Included"],
      ["Institutional AI and advanced reporting", "Planned"],
      ["Multi-campus and advanced access controls", "Planned"],
      ["Up to four attendance terminals in the proposed package", "Proposed"],
    ],
    featured: true,
  },
  {
    name: "Smart Enterprise",
    label: "For school groups and networks",
    description: "A tailored rollout for organisations with multiple schools, integrations or specific needs.",
    price: "Custom",
    badge: "TAILORED",
    highlights: [
      ["Everything in Smart Elite, scoped to your organisation", "Custom"],
      ["Group-wide rollout and integration planning", "Custom"],
      ["Dedicated onboarding and support options", "Custom"],
      ["Hardware, campuses and training sized to your needs", "Custom"],
    ],
  },
] as const;

const comparisonGroups = [
  {
    name: "School foundations",
    rows: [
      { feature: "School workspace and admin dashboard", values: ["Available", "Included", "Included", "Included"] },
      { feature: "Academic years, classes and subject setup", values: ["Available", "Included", "Included", "Included"] },
      { feature: "People records and teacher assignments", values: ["Available", "Included", "Included", "Included"] },
      { feature: "Admissions and student registration", values: ["Planned", "Planned", "Planned", "Planned"] },
    ],
  },
  {
    name: "Teaching, learning & operations",
    rows: [
      { feature: "Attendance workflows", values: ["Planned", "Planned", "Planned", "Planned"] },
      { feature: "Fees and financial tracking", values: ["Planned", "Planned", "Planned", "Planned"] },
      { feature: "Exams, results and performance analytics", values: ["Planned", "Planned", "Planned", "Planned"] },
      { feature: "AI teaching and assessment assistance", values: ["Not included", "Planned", "Planned", "Custom"] },
      { feature: "Student learning support and mastery insights", values: ["Not included", "Planned", "Planned", "Custom"] },
      { feature: "Multi-campus coordination", values: ["Not included", "Not included", "Planned", "Custom"] },
    ],
  },
  {
    name: "Rollout & support",
    rows: [
      { feature: "Attendance terminal allowance", values: ["Up to 1", "Up to 2", "Up to 4", "Scoped"] },
      { feature: "Initial staff training", values: ["Up to 10", "Up to 20", "Up to 35", "Scoped"] },
      { feature: "Deployment and onboarding", values: ["Guided", "Expanded", "Dedicated", "Tailored"] },
    ],
  },
];

const faqs = [
  {
    question: "Are these final prices?",
    answer:
      "The first three amounts are proposed first-year package prices, not a live checkout price. We confirm the final scope and written quote with each school before any commitment.",
  },
  {
    question: "What does the first-year package cover?",
    answer:
      "The proposal is intended to cover the software package, initial onboarding and training, and the stated attendance-terminal allowance. Exact hardware, installation, connectivity and support terms are confirmed in the school’s quote.",
  },
  {
    question: "Are every feature and AI capability available today?",
    answer:
      "No. Features marked Available are in the current product. Planned items describe the roadmap and are not represented as live functionality or guaranteed delivery dates.",
  },
  {
    question: "Is there automatic billing or a payment commitment?",
    answer:
      "No. SmartSchools does not take payment or start a subscription from this page. Submitting a school application starts a conversation; any package, renewal or payment terms must be agreed in a separate written proposal.",
  },
];

function Status({ value }: { value: string }) {
  const className = value === "Available" ? "pricing-status-available" : value === "Planned" ? "pricing-status-planned" : "";
  return <span className={`pricing-status ${className}`}>{value}</span>;
}

function Wordmark() {
  return (
    <Link className="wordmark" href="/" aria-label="SmartSchools home">
      <span className="brand-symbol" aria-hidden="true"><span /><span /><span /><span /></span>
      <span>smart<span className="wordmark-strong">schools</span></span>
    </Link>
  );
}

export default function PricingPage() {
  return (
    <main className="pricing-page">
      <header className="site-header pricing-site-header">
        <div className="header-inner">
          <Wordmark />
          <nav className="desktop-nav pricing-nav" aria-label="Main navigation">
            <Link href="/#platform">Platform</Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/schools">For schools</Link>
            <Link aria-current="page" href="/pricing">Pricing</Link>
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            <Link className="button button-dark header-cta" href="/schools/new">Get started</Link>
          </div>
        </div>
      </header>

      <section className="pricing-hero">
        <div className="pricing-hero-inner">
          <span className="pricing-eyebrow"><i /> PROPOSED SCHOOL PACKAGES</span>
          <h1>Start with a strong foundation.<br /><em>Grow with your school.</em></h1>
          <p>
            Choose the package that fits your school today, with room to grow into connected
            operations, teaching and learning intelligence.
          </p>
          <span className="pricing-unit">Proposed first-year institutional packages · Nigerian naira</span>
        </div>
      </section>

      <section aria-label="SmartSchools pricing plans" className="pricing-plans">
        <div className="pricing-plan-grid">
          {plans.map((plan, index) => (
            <article className={`pricing-card${"featured" in plan && plan.featured ? " pricing-card-featured" : ""}`} key={plan.name}>
              <span className="pricing-plan-badge">{plan.badge}</span>
              <p className="pricing-plan-label">{plan.label}</p>
              <h2>{plan.name}</h2>
              <p className="pricing-plan-description">{plan.description}</p>
              <div className="pricing-price">
                <strong>{plan.price}</strong>
                <span>{plan.price === "Custom" ? "tailored proposal" : "proposed first year"}</span>
              </div>
              <div className="pricing-card-divider" />
              <h3>Package highlights</h3>
              <ul>
                {plan.highlights.map(([feature, status]) => (
                  <li key={feature}>
                    <span aria-hidden="true" className={status === "Available" ? "pricing-check" : "pricing-sparkle"}>
                      {status === "Available" ? "✓" : status === "Included" ? "✓" : "✳"}
                    </span>
                    <span>{feature}<small>{status}</small></span>
                  </li>
                ))}
              </ul>
              <Link className="pricing-card-cta" href="/schools/new">
                {index === 3 ? "Request tailored onboarding" : "Start a school application"} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
        <p className="pricing-note">
          Indicative proposals only. Final scope and pricing may vary by student numbers,
          campuses, hardware, installation and support requirements.
        </p>
      </section>

      <section className="pricing-value-section">
        <div className="pricing-section-heading">
          <span className="pricing-eyebrow">BUILT IN THOUGHTFUL STAGES</span>
          <h2>One platform, with a clear path forward.</h2>
          <p>Start with the school foundations available now. Roadmap capabilities are marked Planned—not promised as live today.</p>
        </div>
        <div className="pricing-value-grid">
          {[
            ["01", "Organise the school", "Set up school structure, academic years, classes, subjects and people records."],
            ["02", "Connect the community", "Bring administrators and teachers into a shared school workspace, with roles and access managed by the school."],
            ["03", "Grow at your pace", "Plan for expanded operations and learning tools as each capability becomes ready for schools."],
          ].map(([number, title, description]) => (
            <article className="pricing-value-card" key={number}>
              <span>{number}</span><h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing-comparison-section">
        <div className="pricing-section-heading">
          <span className="pricing-eyebrow">FEATURE-BY-FEATURE</span>
          <h2>Know what is included—and what is still ahead.</h2>
          <p>“Planned” describes the product roadmap, not a feature available in today’s release.</p>
        </div>
        <div aria-label="Package feature comparison" className="pricing-table-scroll" role="region" tabIndex={0}>
          <table className="pricing-table">
            <thead>
              <tr>
                <th scope="col">Capability</th>
                {plans.map((plan) => <th scope="col" key={plan.name}>{plan.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {comparisonGroups.map((group) => (
                <FragmentGroup key={group.name} name={group.name}>
                  {group.rows.map((row) => (
                    <tr key={row.feature}>
                      <th scope="row">{row.feature}</th>
                      {row.values.map((value, index) => (
                        <td key={`${row.feature}-${plans[index].name}`}>
                          <Status value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </FragmentGroup>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pricing-important">
        <div>
          <span className="pricing-eyebrow">IMPORTANT TO KNOW</span>
          <h2>A plan is not a substitute for a scoped proposal.</h2>
          <p>These are first-year package estimates for SmartSchools services. Any third-party services, connectivity, hardware details, renewal fees and implementation terms must be set out clearly before a school commits.</p>
        </div>
        <ul>
          <li><span>✓</span> No subscription billing or payment is connected to this page.</li>
          <li><span>✓</span> Final inclusions and delivery dates are confirmed in writing.</li>
          <li><span>✓</span> Planned features are roadmap items, not currently available tools.</li>
          <li><span>✓</span> The right package depends on your school’s size and rollout needs.</li>
        </ul>
      </section>

      <section className="pricing-faq-section" id="pricing-questions">
        <div className="pricing-section-heading">
          <span className="pricing-eyebrow">BEFORE YOU CHOOSE</span>
          <h2>Clear answers for school leaders.</h2>
        </div>
        <div className="pricing-faq-list">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="pricing-cta">
        <span className="pricing-eyebrow">START WITH THE REAL WORKFLOW</span>
        <h2>A clearer school day,<br /><em>built around your community.</em></h2>
        <p>Tell us about your school and the team can help scope a suitable first step. An application is not a purchase commitment.</p>
        <Link className="button button-dark" href="/schools/new">Start a school application <span aria-hidden="true">→</span></Link>
      </section>

      <footer className="site-footer">
        <div className="footer-main section-wrap">
          <div className="footer-brand">
            <Wordmark />
            <p>A more connected way to support<br />schools, teachers, learners and families.</p>
          </div>
          <div className="footer-links">
            <span>Explore</span>
            <Link href="/#platform">The platform</Link>
            <Link href="/#how-it-works">Learning OS</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
          <div className="footer-links">
            <span>For schools</span>
            <Link href="/schools">Find your school</Link>
            <Link href="/schools/new">Set up a school</Link>
          </div>
        </div>
        <div className="footer-bottom section-wrap">
          <span>© 2026 SmartSchools</span>
          <span>Built for learning, designed for people.</span>
        </div>
      </footer>
    </main>
  );
}

function FragmentGroup({ name, children }: { name: string; children: ReactNode }) {
  return (
    <>
      <tr className="pricing-table-group"><th colSpan={5} scope="rowgroup">{name}</th></tr>
      {children}
    </>
  );
}
