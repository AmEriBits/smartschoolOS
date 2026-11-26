import type { Metadata } from "next";
import { StudentWorkspace } from "@/features/schools/student-workspace";

type Props = { params: Promise<{ schoolSlug: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  return { title: `Student workspace | ${schoolSlug} | SmartSchools` };
}

export default async function StudentWorkspacePage({ params }: Props) {
  const { schoolSlug } = await params;
  return <StudentWorkspace schoolSlug={schoolSlug} />;
}
