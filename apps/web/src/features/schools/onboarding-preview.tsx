"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function OnboardingPreview() {
  const [schoolName, setSchoolName] = useState("");
  const [location, setLocation] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowSteps(true);
  }

  return (
    <div className="onboarding-layout">
      <div className="onboarding-form-card">
        <div className="onboarding-steps" aria-label="Onboarding progress">
          <span className="onboarding-step-active"><i>1</i> School details</span>
          <span><i>2</i> Verify & invite</span>
          <span><i>3</i> Set up academics</span>
        </div>

        {showSteps ? (
          <div className="onboarding-confirmation" role="status">
            <span className="confirmation-icon">✓</span>
            <p className="eyebrow">Onboarding preview</p>
            <h2>{schoolName} is ready for its setup journey.</h2>
            <p>
              Next, a school owner would verify the organisation, invite the first school
              administrator, and configure campuses and academic structure.
            </p>
            <div className="preview-record">
              <span>School name</span><strong>{schoolName}</strong>
              <span>Location</span><strong>{location}</strong>
              <span>School type</span><strong>{schoolType}</strong>
              <span>School ID</span><strong>Assigned after approval</strong>
            </div>
            <div className="preview-warning">
              This is a front-end preview. Nothing was submitted or saved.
            </div>
            <button className="button button-dark" onClick={() => setShowSteps(false)} type="button">
              Edit details
            </button>
          </div>
        ) : (
          <form className="onboarding-form" onSubmit={handleSubmit}>
            <p className="eyebrow">Start with the basics</p>
            <h2>Tell us about your school.</h2>
            <p className="onboarding-intro">
              This begins a guided setup for your school’s own SmartSchools workspace.
            </p>
            <label>
              School name
              <input
                autoComplete="organization"
                onChange={(event) => setSchoolName(event.target.value)}
                placeholder="e.g. Greenfield Academy"
                required
                value={schoolName}
              />
            </label>
            <div className="onboarding-field-row">
              <label>
                City or town
                <input
                  autoComplete="address-level2"
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g. Ikeja, Lagos"
                  required
                  value={location}
                />
              </label>
              <label>
                School type
                <select
                  onChange={(event) => setSchoolType(event.target.value)}
                  required
                  value={schoolType}
                >
                  <option value="">Select type</option>
                  <option>Primary school</option>
                  <option>Secondary school</option>
                  <option>K–12 school</option>
                  <option>School group</option>
                </select>
              </label>
            </div>
            <div className="preview-warning">
              Preview only—this form does not create an account or send your information.
            </div>
            <button className="button button-dark onboarding-submit" type="submit">
              Preview onboarding <span aria-hidden="true">→</span>
            </button>
            <Link className="onboarding-back" href="/schools">Back to school finder</Link>
          </form>
        )}
      </div>

      <aside className="onboarding-aside">
        <span className="onboarding-aside-mark" aria-hidden="true">✳</span>
        <p className="eyebrow">A guided start</p>
        <h2>One school.<br />A foundation<br />that fits.</h2>
        <p>
          Each school gets its own identity, structure and access. Your team brings the
          right people in as setup progresses.
        </p>
        <ul>
          <li><span>01</span> Verify and provision the school</li>
          <li><span>02</span> Invite the first administrator</li>
          <li><span>03</span> Configure campus and academics</li>
          <li><span>04</span> Welcome teachers and families</li>
        </ul>
      </aside>
    </div>
  );
}
