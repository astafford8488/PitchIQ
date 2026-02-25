"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const VERTICAL_OPTIONS = [
  { id: "podcast", label: "Podcast" },
  { id: "media", label: "Media" },
  { id: "social", label: "Social" },
  { id: "vc", label: "VC" },
];

type FormData = {
  full_name: string;
  bio: string;
  expertise_topics: string;
  target_audience: string;
  goals: string;
  speaking_topics: string;
  past_appearances: string;
  vertical_interests: string[];
};

const STEPS = [
  { title: "Basics", fields: ["full_name", "bio", "expertise_topics", "target_audience"] },
  { title: "Goals & Topics", fields: ["goals", "speaking_topics"] },
  { title: "Past Media & Interests", fields: ["past_appearances", "vertical_interests"] },
];

export function OnboardingWizard({ initial }: { initial: Partial<FormData> }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    full_name: initial?.full_name ?? "",
    bio: initial?.bio ?? "",
    expertise_topics: initial?.expertise_topics ?? "",
    target_audience: initial?.target_audience ?? "",
    goals: initial?.goals ?? "",
    speaking_topics: initial?.speaking_topics ?? "",
    past_appearances: initial?.past_appearances ?? "",
    vertical_interests: initial?.vertical_interests ?? [],
  });

  function toggleVertical(id: string) {
    setForm((p) => ({
      ...p,
      vertical_interests: p.vertical_interests.includes(id)
        ? p.vertical_interests.filter((x) => x !== id)
        : [...p.vertical_interests, id],
    }));
  }

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      vertical_interests: form.vertical_interests.join(","),
      onboarding_completed_at: true,
    };
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="w-full max-w-xl">
      <div className="mb-8">
        <div className="flex gap-2 mb-2">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
            />
          ))}
        </div>
        <h1 className="text-xl font-semibold">{currentStep.title}</h1>
        <p className="text-sm text-[var(--muted)]">Step {step + 1} of {STEPS.length}</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); handleNext(); }}
        className="space-y-6"
      >
        {currentStep.fields.includes("full_name") && (
          <label className="block">
            <span className="text-sm text-[var(--muted)]">Full name</span>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
            />
          </label>
        )}
        {currentStep.fields.includes("bio") && (
          <label className="block">
            <span className="text-sm text-[var(--muted)]">Bio (used in pitches)</span>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)]"
            />
          </label>
        )}
        {currentStep.fields.includes("expertise_topics") && (
          <label className="block">
            <span className="text-sm text-[var(--muted)]">Expertise / topics</span>
            <input
              type="text"
              value={form.expertise_topics}
              onChange={(e) => setForm((p) => ({ ...p, expertise_topics: e.target.value }))}
              placeholder="e.g. SaaS, marketing, coaching"
              className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
            />
          </label>
        )}
        {currentStep.fields.includes("target_audience") && (
          <label className="block">
            <span className="text-sm text-[var(--muted)]">Target audience</span>
            <input
              type="text"
              value={form.target_audience}
              onChange={(e) => setForm((p) => ({ ...p, target_audience: e.target.value }))}
              placeholder="Who you want to reach"
              className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
            />
          </label>
        )}
        {currentStep.fields.includes("goals") && (
          <label className="block">
            <span className="text-sm text-[var(--muted)]">Goals</span>
            <textarea
              value={form.goals}
              onChange={(e) => setForm((p) => ({ ...p, goals: e.target.value }))}
              rows={2}
              placeholder="e.g. Grow my audience, promote my book, build authority"
              className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
            />
          </label>
        )}
        {currentStep.fields.includes("speaking_topics") && (
          <label className="block">
            <span className="text-sm text-[var(--muted)]">Speaking topics</span>
            <input
              type="text"
              value={form.speaking_topics}
              onChange={(e) => setForm((p) => ({ ...p, speaking_topics: e.target.value }))}
              placeholder="e.g. leadership, marketing, SaaS, personal development"
              className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
            />
          </label>
        )}
        {currentStep.fields.includes("past_appearances") && (
          <label className="block">
            <span className="text-sm text-[var(--muted)]">Past media appearances</span>
            <textarea
              value={form.past_appearances}
              onChange={(e) => setForm((p) => ({ ...p, past_appearances: e.target.value }))}
              rows={2}
              placeholder="Podcasts, interviews, or talks you've done"
              className="mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text)] placeholder:text-[var(--muted)]"
            />
          </label>
        )}
        {currentStep.fields.includes("vertical_interests") && (
          <div className="block">
            <span className="text-sm text-[var(--muted)]">Vertical interests</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {VERTICAL_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggleVertical(v.id)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    form.vertical_interests.includes(v.id)
                      ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]"
                      : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="border border-[var(--border)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--surface)]"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "Saving…" : isLast ? "Complete setup" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}
