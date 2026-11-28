"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Model = { id: string; label: string; provider: string; description: string };
type Selection = { resumeTailoring: string; coverLetter: string };

export default function ModelSelectionPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selection, setSelection] = useState<Selection>({ resumeTailoring: "gpt-6-luna", coverLetter: "gpt-6-luna" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/manage/model-selection", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { models?: Model[]; selection?: Selection; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to load model settings.");
        setModels(data.models ?? []);
        if (data.selection) setSelection(data.selection);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load model settings."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/manage/model-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selection),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to save model settings.");
      setMessage("Model settings saved.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to save model settings.");
    } finally {
      setSaving(false);
    }
  };

  const modelDescription = (id: string) => models.find((model) => model.id === id)?.description;

  return (
    <main className="min-h-[calc(100vh-7.5rem)] p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="rise-in border-b border-black/10 pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">System settings</p>
          <h1 className="mt-3 font-(--font-fashion-display) text-4xl text-black">System settings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/60">
            Configure application-wide behavior in focused sections. These settings apply to future runs and never expose provider credentials.
          </p>
        </header>

        <Card className="bg-white/78">
          <CardHeader className="border-b border-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="font-(--font-fashion-display)">AI model selection</CardTitle>
                <CardDescription>Choose the approved model used by each resume workflow. Both workflows stay deterministic and server-validated.</CardDescription>
              </div>
              <Badge>{loading ? "Loading" : "Ready"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-4 md:p-6">
            <ModelField label="Resume tailoring" value={selection.resumeTailoring} models={models} description={modelDescription(selection.resumeTailoring)} onChange={(value) => setSelection({ ...selection, resumeTailoring: value })} />
            <ModelField label="Cover-letter generation" value={selection.coverLetter} models={models} description={modelDescription(selection.coverLetter)} onChange={(value) => setSelection({ ...selection, coverLetter: value })} />
            {message ? <p role="status" className="rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm">{message}</p> : null}
            <Button type="button" size="lg" onClick={() => void save()} disabled={loading || saving}>{saving ? "Saving..." : "Save model settings"}</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function ModelField({ label, value, models, description, onChange }: { label: string; value: string; models: Model[]; description?: string; onChange: (value: string) => void }) {
  return (
    <label className="block max-w-2xl space-y-2 text-sm font-medium">
      {label}
      <select className="form-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {models.map((model) => <option key={model.id} value={model.id}>{model.provider} · {model.label}</option>)}
      </select>
      <span className="block text-xs font-normal text-black/55">{description ?? "Select an approved model."}</span>
    </label>
  );
}
