import type { WorkspaceDefinition } from "@smartschools/contracts";
import { parentWorkspace } from "../parent/workspace";
import { schoolAdminWorkspace } from "../school-admin/workspace";
import { studentWorkspace } from "../student/workspace";
import { teacherWorkspace } from "../teacher/workspace";

export const workspaces = [
  schoolAdminWorkspace,
  teacherWorkspace,
  studentWorkspace,
  parentWorkspace,
] satisfies readonly WorkspaceDefinition[];

export function getWorkspace(id: string) {
  return workspaces.find((workspace) => workspace.id === id);
}
