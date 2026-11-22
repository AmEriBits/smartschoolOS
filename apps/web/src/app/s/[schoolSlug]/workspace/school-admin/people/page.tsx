import type { Metadata } from "next";
import { SchoolPeopleWorkspace } from "@/features/schools/school-people-workspace";

type Props = { params: Promise<{ schoolSlug: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  return { title: `People and class rosters | ${schoolSlug} | SmartSchools` };
}

export default async function SchoolPeoplePage({ params }: Props) {
  const { schoolSlug } = await params;
  return <SchoolPeopleWorkspace schoolSlug={schoolSlug} />;
}
