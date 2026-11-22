import type { Metadata } from "next";
import { SchoolAdminDashboard } from "@/features/schools/school-admin-dashboard";

type Props = { params: Promise<{ schoolSlug: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  return { title: `School administrator dashboard | ${schoolSlug} | SmartSchools` };
}

export default async function SchoolAdminDashboardPage({ params }: Props) {
  const { schoolSlug } = await params;
  return <SchoolAdminDashboard schoolSlug={schoolSlug} />;
}
