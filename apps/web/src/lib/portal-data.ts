export type PortalInfo = {
  label: string;
  title: string;
  intro: string;
  focus: string;
  modules: { title: string; description: string }[];
};

export const portalData = {
  "school-admin": {
    label: "School workspace",
    title: "A clearer view of your school.",
    intro:
      "Bring your school structure, curriculum, teaching and day-to-day operations into one connected workspace.",
    focus: "Start with the school foundations",
    modules: [
      {
        title: "School structure",
        description: "Organisation, campuses, academic years, terms, sections, grades and class arms.",
      },
      {
        title: "Academics & curriculum",
        description: "Subject offerings, approved curriculum, learning objectives and academic records.",
      },
      {
        title: "Teaching workspace",
        description: "Lesson preparation, class resources, assignments and teacher-reviewed AI support.",
      },
      {
        title: "School operations",
        description: "Admissions, enrolments, staff assignments, timetables and attendance.",
      },
      {
        title: "Learning intelligence",
        description: "Topic-level evidence, class progress and practical intervention signals.",
      },
      {
        title: "Family connection",
        description: "Verified family links, school notices and shared student progress.",
      },
    ],
  },
  student: {
    label: "Student workspace",
    title: "Your learning, in focus.",
    intro:
      "A personal learning space to understand what you know, practise what comes next and make room for your ideas.",
    focus: "Learning that moves with you",
    modules: [
      {
        title: "My learning plan",
        description: "A clear sequence of topics, practice and revision shaped around learning goals.",
      },
      {
        title: "AI study partner",
        description: "Curriculum-grounded explanations and guided practice designed for your class level.",
      },
      {
        title: "Progress & mastery",
        description: "See strengths, topics to revisit and progress over time—not just a single score.",
      },
      {
        title: "Classroom & assessments",
        description: "Lessons, assignments, quizzes and feedback from your teachers.",
      },
      {
        title: "STEM projects",
        description: "Explore practical challenges in science, engineering, coding and robotics.",
      },
      {
        title: "My portfolio",
        description: "Collect project evidence, reflections, skills and achievements as you grow.",
      },
    ],
  },
  family: {
    label: "Family workspace",
    title: "Stay close to their progress.",
    intro:
      "One trusted place for a family to follow each child’s school journey and stay connected with their school.",
    focus: "A shared view for every family",
    modules: [
      {
        title: "Every child, one view",
        description: "A family dashboard designed for verified links to multiple children and schools.",
      },
      {
        title: "Learning progress",
        description: "Understand learning plans, topic progress, strengths and ways to offer support.",
      },
      {
        title: "Attendance & school life",
        description: "Keep track of attendance updates, notices and important school information.",
      },
      {
        title: "School communication",
        description: "Stay connected to teachers and school updates in one organised place.",
      },
      {
        title: "Permissions & approvals",
        description: "Manage family access and respond to school requests with clear consent.",
      },
      {
        title: "Fees & payments",
        description: "A future workspace for statements, payment history and family finance tools.",
      },
    ],
  },
} satisfies Record<string, PortalInfo>;

export type PortalRole = keyof typeof portalData;

export function isPortalRole(value: string): value is PortalRole {
  return Object.hasOwn(portalData, value);
}
