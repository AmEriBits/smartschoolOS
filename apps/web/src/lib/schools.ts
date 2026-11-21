export type School = {
  id: string;
  slug: string;
  name: string;
  location: string;
  schoolCode: string;
  type: string;
  initials: string;
  accent: "green" | "blue";
};

export const schools: School[] = [
  {
    id: "demo-greenfield",
    slug: "greenfield-academy",
    name: "Greenfield Academy",
    location: "Ikeja, Lagos",
    schoolCode: "GRN-2048",
    type: "K–12 school",
    initials: "GA",
    accent: "green",
  },
  {
    id: "demo-lakeside",
    slug: "lakeside-college",
    name: "Lakeside College",
    location: "Abuja",
    schoolCode: "LAK-3172",
    type: "Secondary school",
    initials: "LC",
    accent: "blue",
  },
];

export function getSchoolBySlug(slug: string) {
  return schools.find((school) => school.slug === slug);
}
