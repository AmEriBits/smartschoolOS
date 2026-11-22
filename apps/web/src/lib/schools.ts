import { API_BASE_URL } from "./api";

export type School = {
  id: string;
  slug: string;
  name: string;
  location: string;
  schoolCode: string;
  schoolType: string;
};

export function getSchoolInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase() ?? "")
    .join("");
}

export function getSchoolBySlug(slug: string): Promise<School | null> {
  return fetch(`${API_BASE_URL}/schools/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  }).then(async (response) => {
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Could not load this school (${response.status}).`);
    }
    return (await response.json()) as School;
  });
}
