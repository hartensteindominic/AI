"use client";

import { FormEvent, useState } from "react";

const choices = [
  { value: "person", label: "A person", icon: "☺" },
  { value: "pet", label: "A pet", icon: "♢" },
  { value: "pair", label: "A pair", icon: "∞" },
];

const vibes = ["Bright & playful", "Dark & cinematic", "Soft & dreamy"];

export default function OrderBuilder() {
  const [subject, setSubject] = useState("person");
  const [vibe, setVibe] = useState(vibes[0]);

  function openOrderEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const notes = String(form.get("notes") || "").trim() || "No extra notes yet.";
    const portraitLabel = choices.find((choice) => choice.value === subject)?.label || subject;
    const body = [
      "Hi Dominic,",
      "",
      "I'd like to order a $15 VoxelMe portrait.",
      "",
      `My email: ${email}`,
      `Portrait: ${portraitLabel}`,
      `Vibe: ${vibe}`,
      `Notes: ${notes}`,
      "",
      "I'll attach 1–3 clear photos to this email before sending.",
    ].join("\n");

    window.location.href = `mailto:hartensteindominic@gmail.com?subject=${encodeURIComponent("My $15 VoxelMe portrait")}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form className="order-builder" onSubmit={openOrderEmail}>
      <fieldset>
        <legend><span>01</span> Who is this portrait for?</legend>
        <div className="choice-grid subject-grid">
          {choices.map((choice) => (
            <label key={choice.value} className={subject === choice.value ? "choice-card selected" : "choice-card"}>
              <input type="radio" name="subject" value={choice.value} checked={subject === choice.value} onChange={() => setSubject(choice.value)} />
              <i>{choice.icon}</i>
              <span>{choice.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend><span>02</span> Pick the vibe</legend>
        <div className="choice-grid vibe-grid">
          {vibes.map((option) => (
            <label key={option} className={vibe === option ? "pill-choice selected" : "pill-choice"}>
              <input type="radio" name="vibe" value={option} checked={vibe === option} onChange={() => setVibe(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend><span>03</span> Where should we reply?</legend>
        <label className="field-label" htmlFor="order-email">Your email</label>
        <input className="text-field" id="order-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        <label className="field-label" htmlFor="order-notes">Anything we should know? <em>Optional</em></label>
        <textarea className="text-field text-area" id="order-notes" name="notes" rows={4} placeholder="Favorite colors, background idea, gift occasion…" />
      </fieldset>

      <div className="order-submit-row">
        <div className="price-lockup"><strong>$15</strong><span>one-time<br />total</span></div>
        <button className="button button-primary order-button" type="submit">
          Open email & attach photos
          <svg aria-hidden="true" viewBox="0 0 20 20" className="arrow-icon"><path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
        </button>
      </div>
      <p className="order-note">Nothing is charged here. We confirm your brief, then reply with a secure $15 payment link.</p>
    </form>
  );
}
