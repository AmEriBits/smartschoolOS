"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { schools } from "@/lib/schools";

export function SchoolDirectory() {
  const [query, setQuery] = useState("");
  const filteredSchools = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return schools;

    return schools.filter((school) =>
      [school.name, school.location, school.schoolCode]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search),
    );
  }, [query]);

  return (
    <>
      <label className="school-search">
        <span className="school-search-icon" aria-hidden="true">⌕</span>
        <span className="visually-hidden">Search schools</span>
        <input
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by school name, city or school code"
          type="search"
          value={query}
        />
      </label>

      <div className="school-directory-meta">
        <span>{query ? `${filteredSchools.length} matching schools` : "Featured schools"}</span>
        <span className="directory-preview"><i /> Sample directory</span>
      </div>

      {filteredSchools.length ? (
        <div className="school-directory-grid">
          {filteredSchools.map((school) => (
            <Link
              className="school-directory-card"
              href={`/s/${school.slug}`}
              key={school.id}
            >
              <span className={`school-avatar school-avatar-${school.accent}`}>
                {school.initials}
              </span>
              <span className="school-card-copy">
                <strong>{school.name}</strong>
                <span>{school.location} · {school.type}</span>
                <span className="school-code">School code {school.schoolCode}</span>
              </span>
              <span className="school-card-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="school-empty-state">
          <span aria-hidden="true">⌕</span>
          <strong>No school matches that search yet.</strong>
          <p>Check the spelling or use the school code provided by your school.</p>
        </div>
      )}
    </>
  );
}
