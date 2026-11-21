export const workspaces = [
  {
    id: "school-admin",
    label: "School administrator",
    description: "Manage admissions, people, academics and school operations.",
    icon: "⌂",
    tone: "mint",
  },
  {
    id: "teacher",
    label: "Teacher",
    description: "Prepare lessons, manage classes and support student progress.",
    icon: "✳",
    tone: "lavender",
  },
  {
    id: "student",
    label: "Student",
    description: "Continue learning, practise and keep track of your progress.",
    icon: "↗",
    tone: "peach",
  },
  {
    id: "parent",
    label: "Parent or guardian",
    description: "Follow your child’s learning and stay connected with school.",
    icon: "♡",
    tone: "blue",
  },
] as const;

export type WorkspaceId = (typeof workspaces)[number]["id"];

export function getWorkspace(id: string) {
  return workspaces.find((workspace) => workspace.id === id);
}
