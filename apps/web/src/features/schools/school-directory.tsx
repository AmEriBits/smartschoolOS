"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { School } from "@/lib/schools";
import { getSchoolInitials } from "@/lib/schools";

export function SchoolDirectory() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{
    query: string;
    schools: School[];
    error: string;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void apiRequest<School[]>(`/schools${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ""}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((schools) => setResult({ query, schools, error: "" }))
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            query,
            schools: [],
            error: requestError instanceof Error ? requestError.message : "Could not load the school directory.",
          });
        }
      });

    return () => controller.abort();
  }, [query]);

  const loading = !result || result.query !== query;
  const schools = loading ? [] : result.schools;
  const error = loading ? "" : result.error;

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
        <span>
          {loading
            ? "Loading schools…"
            : query
              ? `${schools.length} matching schools`
              : `${schools.length} active schools`}
        </span>
        <span className="directory-preview"><i /> Verified directory</span>
      </div>

      {error ? (
        <div className="school-empty-state" role="alert">
          <strong>School directory unavailable.</strong>
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="school-empty-state" role="status">Loading active schools…</div>
      ) : schools.length ? (
        <div className="school-directory-grid">
          {schools.map((school, index) => (
            <Link
              className="school-directory-card"
              href={`/s/${school.slug}`}
              key={school.id}
            >
              <span className={`school-avatar school-avatar-${index % 2 ? "blue" : "green"}`}>
                {getSchoolInitials(school.name)}
              </span>
              <span className="school-card-copy">
                <strong>{school.name}</strong>
                <span>{school.location} · {school.schoolType}</span>
                <span className="school-code">School code {school.schoolCode}</span>
              </span>
              <span className="school-card-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="school-empty-state">
          <span aria-hidden="true">⌕</span>
          <strong>{query ? "No school matches that search yet." : "No schools are publicly listed yet."}</strong>
          <p>
            {query
              ? "Check the spelling or use the school code provided by your school."
              : "Schools appear here after the first administrator completes onboarding and the platform activates the school."}
          </p>
        </div>
      )}
    </>
  );
}
