import type { Metadata } from "next";
import { TeacherWorkspace } from "@/features/schools/teacher-workspace";

type Props = { params: Promise<{ schoolSlug: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  return { title: `Teacher workspace | ${schoolSlug} | SmartSchools` };
}

export default async function TeacherWorkspacePage({ params }: Props) {
  const { schoolSlug } = await params;
  return <TeacherWorkspace schoolSlug={schoolSlug} />;
}
