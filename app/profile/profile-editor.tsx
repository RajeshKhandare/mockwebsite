"use client";

import { useState } from "react";
import { updateProfile } from "./actions";

type Props = {
  initial: {
    displayName: string;
    email: string;
    targetExam: string;
    educationLevel: string;
    state: string;
    preparationStage: string;
    preferredLanguage: string;
  };
  exams: string[];
  error?: string;
  saved?: boolean;
};

export default function ProfileEditor({ initial, exams, error, saved }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="panel profile-editor-panel">
      <div className="profile-editor-head">
        <div>
          <p className="eyebrow">Preparation profile</p>
          <h2>Your study details</h2>
          <p className="muted">Keep your exam goal and preparation preferences up to date.</p>
        </div>
        {!editing && <button className="button" type="button" onClick={() => setEditing(true)}>Edit profile</button>}
      </div>

      {saved && <p className="form-message success">Profile updated successfully.</p>}
      {error && <p className="form-message error">{error === "name" ? "Please enter your name." : "We could not save your profile. Please try again."}</p>}

      {editing ? (
        <form className="profile-edit-form" action={updateProfile}>
          <label>Name<input name="display_name" defaultValue={initial.displayName} maxLength={80} required /></label>
          <label>Target exam
            <select name="target_exam" defaultValue={initial.targetExam}>
              <option value="">Select an exam</option>
              {exams.map((exam) => <option key={exam} value={exam}>{exam}</option>)}
            </select>
          </label>
          <label>Education
            <select name="education_level" defaultValue={initial.educationLevel}>
              <option value="">Select education</option>
              <option value="10th">Class 10 / SSC</option>
              <option value="12th">Class 12 / HSC</option>
              <option value="graduate">Graduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Preparation stage
            <select name="preparation_stage" defaultValue={initial.preparationStage}>
              <option value="">Select stage</option>
              <option value="beginner">Just starting</option>
              <option value="preparing">Preparing</option>
              <option value="revision">Revision</option>
              <option value="mock-tests">Mock-test focused</option>
            </select>
          </label>
          <label>State
            <select name="state" defaultValue={initial.state}>
              <option value="">Select state</option>
              <option>Maharashtra</option><option>Gujarat</option><option>Madhya Pradesh</option><option>Rajasthan</option>
              <option>Delhi</option><option>Karnataka</option><option>Uttar Pradesh</option><option>Bihar</option>
              <option>West Bengal</option><option>Tamil Nadu</option><option>Telangana</option><option>Andhra Pradesh</option><option>Other</option>
            </select>
          </label>
          <label>Preferred language
            <select name="preferred_language" defaultValue={initial.preferredLanguage || "en"}>
              <option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option>
            </select>
          </label>
          <div className="profile-edit-actions">
            <button className="button primary" type="submit">Save changes</button>
            <button className="button" type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="profile-fields profile-fields-readable">
          <div><span>Name</span><strong>{initial.displayName}</strong></div>
          <div><span>Email</span><strong>{initial.email}</strong></div>
          <div><span>Target exam</span><strong>{initial.targetExam || "Not set"}</strong></div>
          <div><span>Preparation stage</span><strong>{initial.preparationStage || "Not set"}</strong></div>
          <div><span>Education</span><strong>{initial.educationLevel || "Not set"}</strong></div>
          <div><span>State</span><strong>{initial.state || "Not set"}</strong></div>
          <div><span>Preferred language</span><strong>{initial.preferredLanguage.toUpperCase()}</strong></div>
        </div>
      )}
    </section>
  );
}
