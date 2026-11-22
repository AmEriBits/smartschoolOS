import type { Metadata } from "next";
import { SchoolSetupWorkspace } from "@/features/schools/school-setup-workspace";

type Props = { params: Promise<{ schoolSlug: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  return { title: `School setup | ${schoolSlug} | SmartSchools` };
}

export default async function SchoolSetupPage({ params }: Props) {
  const { schoolSlug } = await params;
  return <SchoolSetupWorkspace schoolSlug={schoolSlug} />;
}
