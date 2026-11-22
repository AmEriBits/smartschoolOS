import Link from "next/link";
import type { ReactNode } from "react";

const products = [
  {
    number: "01",
    title: "Smart Academics",
    description:
      "Connect school structure, academic records, assessments and exam readiness—including Nigerian curricula.",
    icon: "academics",
  },
  {
    number: "02",
    title: "Curriculum Intelligence",
    description:
      "Turn approved schemes of work into validated, versioned topics, objectives and teaching plans.",
    icon: "curriculum",
  },
  {
    number: "03",
    title: "AI Learning OS",
    description:
      "Use curriculum-grounded tutoring and topic-level mastery to guide each learner’s next step.",
    icon: "learning",
  },
  {
    number: "04",
    title: "Smart Teacher",
    description:
      "Prepare lesson plans, activities and assessments for teacher review before they reach a class.",
    icon: "teacher",
  },
  {
    number: "05",
    title: "Smart Classroom",
    description:
      "Bring concepts to life with interactive lessons, visual resources, experiments and practice.",
    icon: "classroom",
  },
  {
    number: "06",
    title: "STEM & Innovation",
    description:
      "Connect coding, robotics and engineering projects to classroom learning and student portfolios.",
    icon: "stem",
  },
  {
    number: "07",
    title: "School Operations",
    description:
      "Coordinate admissions, classes, timetables, attendance, communication and transport.",
    icon: "operations",
  },
  {
    number: "08",
    title: "Family & Finance",
    description:
      "Give verified families a connected view of children, school updates, approvals and payments.",
    icon: "family",
  },
  {
    number: "09",
    title: "Future Pathways",
    description:
      "Help students explore their interests, skills, project portfolios and future study options.",
    icon: "future",
  },
];

const portals = [
  {
    title: "School admin",
    description: "Set up your school and bring academics, teaching and operations together.",
    href: "/schools",
    icon: "school",
    tone: "mint",
  },
  {
    title: "Teacher",
    description: "Prepare lessons, guide classroom learning and support student progress.",
    href: "/schools",
    icon: "teacher",
    tone: "blue",
  },
  {
    title: "Student",
    description: "See a learning space built around progress, practice and curiosity.",
    href: "/schools",
    icon: "student",
    tone: "lavender",
  },
  {
    title: "Parent or guardian",
    description: "Stay connected to each child’s learning, attendance and school updates.",
    href: "/schools",
    icon: "family",
    tone: "peach",
  },
];

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      {diagonal ? (
        <path d="M5 15 15 5M6 5h9v9" />
      ) : (
        <path d="M3.5 10h12m-5-5 5 5-5 5" />
      )}
    </svg>
  );
}

function ProductIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    academics: <><path d="M4.5 5.5h11v10h-11z" /><path d="M7.5 8.5h5m-5 3h5" /></>,
    curriculum: <><path d="M5 4.5h10v12H5z" /><path d="M7.5 7.5h5m-5 3h5m-5 3h3" /><path d="M3 7v10h9" /></>,
    learning: <><path d="M10 3.8 12 8l4.6.7-3.3 3.2.8 4.5L10 14.3l-4.1 2.1.8-4.5-3.3-3.2L8 8z" /></>,
    teacher: <><path d="M4 5h12v8H9l-4 3z" /><path d="M7 8h6m-6 2.5h4" /></>,
    classroom: <><path d="M3.5 5h13v9h-13z" /><path d="m8 16 2-2 2 2m-2-2v3" /><path d="M7 8h6m-6 3h3" /></>,
    stem: <><path d="M8 3.5h4m-3 0v5l-4 6.7a1 1 0 0 0 .9 1.5h8.2a1 1 0 0 0 .9-1.5L11 8.5v-5" /><path d="M7.3 12h5.4" /></>,
    operations: <><path d="M4 7h12v9H4zM7 4h6v3H7z" /><path d="M7 10h6m-6 3h3" /></>,
    future: <><circle cx="10" cy="10" r="6.5" /><path d="M10 6v4l2.5 1.5" /></>,
    school: <><path d="m3.5 8 6.5-4 6.5 4v8h-13z" /><path d="M7 16v-5h6v5M7 8.5h.01M10 8.5h.01M13 8.5h.01" /></>,
    student: <><circle cx="10" cy="6.5" r="2.5" /><path d="M4.5 16v-1a5.5 5.5 0 0 1 11 0v1z" /></>,
    family: <><circle cx="7" cy="7" r="2" /><circle cx="13.5" cy="8" r="1.7" /><path d="M2.8 16v-1a4.2 4.2 0 0 1 8.4 0v1zm9.2 0v-1a3.5 3.5 0 0 1 5-.9" /></>,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      {paths[name]}
    </svg>
  );
}

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link className={`wordmark${light ? " wordmark-light" : ""}`} href="/" aria-label="SmartSchools home">
      <span className="brand-symbol" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span>smart<span className="wordmark-strong">schools</span></span>
    </Link>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <Wordmark />
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#platform">Platform</a>
            <a href="#how-it-works">How it works</a>
            <a href="#for-schools">For schools</a>
            <Link href="/schools">Find your school</Link>
          </nav>
          <Link className="button button-dark header-cta" href="/schools">
            Find your school <ArrowIcon diagonal />
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow eyebrow-light">
              <span className="eyebrow-dot" />
              A connected operating system for schools
            </div>
            <h1>Better learning.<br />Less fragmented.</h1>
            <p className="hero-intro">
              One thoughtful platform for the people, learning and everyday work that make a school thrive.
            </p>
            <div className="hero-actions">
              <a className="button button-lime" href="#platform">
                Discover the platform <ArrowIcon />
              </a>
              <Link className="text-link text-link-light" href="/schools">
                Find your school <ArrowIcon diagonal />
              </Link>
            </div>
            <div className="hero-note">
              <span className="note-line" />
              Built around your school. Designed for what comes next.
            </div>
          </div>

          <div className="hero-art" aria-label="Illustration of connected school workspaces">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-orbit-track" aria-hidden="true">
              <div className="hero-orbit-label label-academics">Academics</div>
              <div className="hero-orbit-label label-learning">Learning</div>
              <div className="hero-orbit-label label-family">Family</div>
              <div className="hero-orbit-label label-teaching">Teaching</div>
              <div className="hero-orbit-label label-school">School life</div>
              <span className="orbit-node node-one" />
              <span className="orbit-node node-two" />
              <span className="orbit-node node-three" />
              <span className="orbit-node node-four" />
            </div>
            <div className="hero-center">
              <span className="center-spark">✳</span>
              <span>One connected<br />school community</span>
            </div>
          </div>

          <div className="hero-foot">
            <span>Education, intelligence and innovation</span>
            <span className="hero-foot-separator" />
            <span>Designed for real school communities</span>
          </div>
        </div>
      </section>

      <section className="intro-section section-wrap">
        <div className="intro-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> One shared foundation</span>
          <h2>Every part of school,<br /><span>working as one.</span></h2>
        </div>
        <div className="intro-copy">
          <p>
            SmartSchools brings the school’s essential systems together—so academic insight can guide teaching,
            learning can feel personal, and families can stay in the loop.
          </p>
          <a className="text-link" href="#how-it-works">See how it connects <ArrowIcon /></a>
        </div>
      </section>

      <section className="platform-section section-wrap" id="platform">
        <div className="section-heading">
          <div>
            <span className="eyebrow"><span className="eyebrow-dot" /> The platform</span>
            <h2>One platform.<br /><span>Room to grow.</span></h2>
          </div>
          <p>Start with the foundations. Add capabilities as your school is ready. Everything stays connected.</p>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.number}>
              <div className="product-card-top">
                <span className="product-icon"><ProductIcon name={product.icon} /></span>
                <span className="product-number">{product.number}</span>
              </div>
              <h3>{product.title}</h3>
              <p>{product.description}</p>
              <span className="card-bottom-mark" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
        <p className="phase-note"><span className="phase-dot" /> Later phases can add payments, deeper transport integrations and physical innovation spaces—with school teams in control of what goes live.</p>
      </section>

      <section className="learning-section" id="how-it-works">
        <div className="learning-inner section-wrap">
          <div className="learning-copy">
            <span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> Learning that adapts</span>
            <h2>Understand the learner.<br /><span>Support the next step.</span></h2>
            <p>
              Learning should respond to what a student understands today—not just where a class is on the timetable.
              SmartSchools connects assessment evidence to practical, teacher-supported action.
            </p>
            <Link className="text-link text-link-light" href="/schools">Explore the student experience <ArrowIcon /></Link>
          </div>
          <div className="learning-cycle" aria-label="Learning cycle: assess, diagnose, personalise, teach, practise, adapt">
            {["Assess", "Diagnose", "Personalise", "Teach", "Practise", "Adapt"].map((item, index) => (
              <div className={`cycle-step${index === 0 ? " cycle-step-active" : ""}`} key={item}>
                <span className="cycle-index">0{index + 1}</span>
                <span>{item}</span>
                {index < 5 && <span className="cycle-arrow" aria-hidden="true">→</span>}
              </div>
            ))}
            <div className="cycle-center">
              <span>Every learner</span>
              <strong>keeps moving</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="school-section section-wrap" id="for-schools">
        <div className="school-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Your school, clearly structured</span>
          <h2>One school.<br /><span>One source of truth.</span></h2>
          <p>
            Organise the school from the top down, then connect that structure to the real work of teaching and learning.
          </p>
          <ul className="check-list">
            <li><span>✓</span> Organisation, school and campus</li>
            <li><span>✓</span> Academic years, terms and sections</li>
            <li><span>✓</span> Grades, class arms and enrolments</li>
            <li><span>✓</span> Subjects, teachers and learning sessions</li>
          </ul>
          <Link className="button button-dark" href="/schools/new">Set up your school <ArrowIcon /></Link>
        </div>
        <div className="school-map" aria-label="School hierarchy illustration">
          <div className="map-line map-line-one" />
          <div className="map-line map-line-two" />
          <div className="map-line map-line-three" />
          <div className="map-node map-root"><span className="map-node-icon">✳</span><span>School organisation</span><b>Greenfield Learning Group</b></div>
          <div className="map-node map-school"><span className="map-node-icon">⌂</span><span>School</span><b>Greenfield Academy</b></div>
          <div className="map-branch">
            <div className="map-node map-campus"><span className="map-node-icon">◈</span><span>Campus</span><b>Main campus</b></div>
            <div className="map-node map-session"><span className="map-node-icon">◷</span><span>Academic year</span><b>2026 / 2027</b></div>
          </div>
          <div className="map-branch map-classes">
            <div className="map-node map-class"><span>Grade</span><b>JSS 1</b></div>
            <div className="map-node map-class"><span>Class arm</span><b>JSS 1A</b></div>
            <div className="map-node map-class"><span>Subjects</span><b>Mathematics · English +</b></div>
          </div>
          <div className="map-caption"><span className="caption-pulse" /> A structure that connects every role</div>
        </div>
      </section>

      <section className="portal-section section-wrap" id="workspaces">
        <div className="section-heading portal-heading">
          <div>
            <span className="eyebrow"><span className="eyebrow-dot" /> Made for the whole community</span>
            <h2>Different roles.<br /><span>One shared picture.</span></h2>
          </div>
          <p>Each person gets a more relevant view, grounded in the same school community and learning journey.</p>
        </div>
        <div className="portal-grid">
          {portals.map((portal) => (
            <Link className={`portal-card portal-${portal.tone}`} href={portal.href} key={portal.title}>
              <div className="portal-card-head">
                <span className="portal-icon"><ProductIcon name={portal.icon} /></span>
                <span className="portal-arrow"><ArrowIcon diagonal /></span>
              </div>
              <h3>{portal.title}</h3>
              <p>{portal.description}</p>
              <span className="portal-open">Find your school <ArrowIcon /></span>
            </Link>
          ))}
        </div>
        <p className="preview-disclaimer">Choose your school before entering a workspace. The public directory lists active schools, and every role is checked against its school membership.</p>
      </section>

      <section className="principles-section">
        <div className="principles-inner section-wrap">
          <div className="principles-intro">
            <span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> Thoughtful by design</span>
            <h2>Built to help people<br />do their best work.</h2>
          </div>
          <div className="principle">
            <span className="principle-number">01</span>
            <h3>Grounded in curriculum</h3>
            <p>Learning support connects back to approved curriculum and clear learning objectives.</p>
          </div>
          <div className="principle">
            <span className="principle-number">02</span>
            <h3>People stay in control</h3>
            <p>Teachers review AI-assisted resources. Schools validate curriculum before it is used.</p>
          </div>
          <div className="principle">
            <span className="principle-number">03</span>
            <h3>Designed for student growth</h3>
            <p>Progress is a journey—not a label. Recommendations stay explainable and revisable.</p>
          </div>
        </div>
      </section>

      <section className="closing-section section-wrap">
        <div className="closing-decoration" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="closing-content">
          <span className="eyebrow"><span className="eyebrow-dot" /> The future of school, built together</span>
          <h2>Let’s make room<br />for <span>what’s possible.</span></h2>
          <p>A connected school experience begins with a stronger foundation.</p>
          <Link className="button button-dark" href="/schools">Find your school <ArrowIcon /></Link>
        </div>
        <div className="closing-mark" aria-hidden="true">S</div>
      </section>

      <footer className="site-footer">
        <div className="footer-main section-wrap">
          <div className="footer-brand">
            <Wordmark />
            <p>A more connected way to support<br />schools, teachers, learners and families.</p>
          </div>
          <div className="footer-links">
            <span>Explore</span>
            <a href="#platform">The platform</a>
            <a href="#how-it-works">Learning OS</a>
            <a href="#for-schools">For schools</a>
          </div>
          <div className="footer-links">
            <span>Workspaces</span>
            <Link href="/schools">School workspaces</Link>
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
