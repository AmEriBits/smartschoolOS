import Link from "next/link";

const schoolRows = [
  { initials: "GA", name: "Greenfield Academy", location: "Ikeja, Lagos", status: "Active", tone: "active", date: "Today" },
  { initials: "LC", name: "Lakeside College", location: "Abuja", status: "Onboarding", tone: "onboarding", date: "Yesterday" },
  { initials: "HC", name: "Hillcrest School", location: "Ibadan, Oyo", status: "Review needed", tone: "review", date: "18 Nov 2026" },
];

const activities = [
  { title: "School setup started", detail: "Lakeside College · Tenant onboarding", time: "1 hour ago", icon: "＋" },
  { title: "School profile updated", detail: "Greenfield Academy · Platform operations", time: "Yesterday", icon: "↗" },
  { title: "Support request opened", detail: "Hillcrest School · Access and roles", time: "18 Nov 2026", icon: "?" },
];

export default function PlatformConsolePage() {
  return (
    <main className="console-shell">
      <aside className="console-sidebar">
        <Link className="console-brand" href="/" aria-label="SmartSchools Platform Console">
          <span className="console-brand-mark">S</span>
          <span>smart<span>schools</span><small>PLATFORM CONSOLE</small></span>
        </Link>
        <div className="console-nav-label">PLATFORM</div>
        <nav className="console-nav" aria-label="Platform navigation">
          <a className="console-nav-active" href="#overview"><span>◫</span> Overview</a>
          <a href="#schools"><span>⌂</span> Schools <b>08</b></a>
          <a href="#onboarding"><span>↗</span> Onboarding <b>03</b></a>
          <a href="#operations"><span>◷</span> Operations</a>
          <a href="#support"><span>♡</span> Support</a>
        </nav>
        <div className="console-sidebar-bottom">
          <div className="console-user">
            <span className="console-user-avatar">SS</span>
            <span><strong>Platform team</strong><small>Operator preview</small></span>
            <span className="console-user-menu">···</span>
          </div>
          <a href="https://smartschool-os-chi.vercel.app">← Back to SmartSchools</a>
        </div>
      </aside>

      <section className="console-main" id="overview">
        <header className="console-topbar">
          <div className="console-breadcrumb">Platform <span>/</span> Overview</div>
          <div className="console-topbar-actions">
            <span className="console-preview-chip"><i /> Prototype data</span>
            <button type="button" aria-label="Notifications">♧<i /></button>
            <span className="console-top-avatar">SS</span>
          </div>
        </header>

        <div className="console-content">
          <div className="console-welcome-row">
            <div>
              <span className="console-eyebrow">SMARTSCHOOLS OPERATIONS</span>
              <h1>Platform overview</h1>
              <p>Provision schools, support their teams, and keep the platform running thoughtfully.</p>
            </div>
            <a className="console-primary-action" href="#onboarding">＋ <span>Start school onboarding</span></a>
          </div>

          <div className="console-notice">
            <span>i</span>
            <p>
              This console is a UI prototype with sample records. It is not connected to live schools,
              tenant provisioning, support systems, or operational metrics.
            </p>
          </div>

          <section className="console-metrics" aria-label="Sample platform metrics">
            <article className="console-metric-card">
              <div><span>Schools on platform</span><b>↗</b></div>
              <strong>08</strong>
              <small><i className="metric-dot green" /> Illustrative active tenants</small>
            </article>
            <article className="console-metric-card">
              <div><span>In onboarding</span><b>↗</b></div>
              <strong>03</strong>
              <small><i className="metric-dot gold" /> Illustrative setup requests</small>
            </article>
            <article className="console-metric-card">
              <div><span>Open support items</span><b>↗</b></div>
              <strong>02</strong>
              <small><i className="metric-dot blue" /> Illustrative support queue</small>
            </article>
            <article className="console-metric-card">
              <div><span>Platform status</span><b>↗</b></div>
              <strong className="metric-status">Operational</strong>
              <small><i className="metric-dot green" /> Demo status only</small>
            </article>
          </section>

          <div className="console-content-grid">
            <section className="console-panel console-schools" id="schools">
              <div className="console-panel-heading">
                <div><span className="console-eyebrow">TENANT DIRECTORY</span><h2>Schools</h2></div>
                <a href="#schools">View directory <span>→</span></a>
              </div>
              <div className="console-table-wrap">
                <table>
                  <thead><tr><th>School</th><th>Status</th><th>Started</th><th aria-label="Actions" /></tr></thead>
                  <tbody>
                    {schoolRows.map((school) => (
                      <tr key={school.name}>
                        <td>
                          <div className="console-school-name">
                            <span className="console-school-avatar">{school.initials}</span>
                            <span><strong>{school.name}</strong><small>{school.location}</small></span>
                          </div>
                        </td>
                        <td><span className={`console-status status-${school.tone}`}><i />{school.status}</span></td>
                        <td className="console-date">{school.date}</td>
                        <td><button className="console-more" type="button" aria-label={`More actions for ${school.name}`}>···</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="console-sample-caption">Sample records · No school data is connected</p>
            </section>

            <section className="console-panel console-activity" id="operations">
              <div className="console-panel-heading">
                <div><span className="console-eyebrow">PLATFORM AUDIT</span><h2>Recent activity</h2></div>
                <a href="#operations" aria-label="View all platform activity">···</a>
              </div>
              <div className="activity-list">
                {activities.map((activity) => (
                  <article className="activity-item" key={activity.title}>
                    <span className="activity-icon">{activity.icon}</span>
                    <div><strong>{activity.title}</strong><p>{activity.detail}</p><small>{activity.time}</small></div>
                  </article>
                ))}
              </div>
              <p className="console-sample-caption">Illustrative activity only</p>
            </section>
          </div>

          <section className="console-onboarding-panel" id="onboarding">
            <div className="onboarding-panel-icon">✳</div>
            <div>
              <span className="console-eyebrow">A THOUGHTFUL FIRST STEP</span>
              <h2>Every school gets its own trusted foundation.</h2>
              <p>
                The live onboarding workflow will verify the school, provision its tenant,
                invite the first administrator, and guide academic setup.
              </p>
            </div>
            <span className="onboarding-panel-step">Provision → Verify → Set up → Activate</span>
          </section>
        </div>
      </section>
    </main>
  );
}
