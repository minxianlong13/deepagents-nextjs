"use client";

import { useState } from "react";
import { Check, Clipboard, Download, FileText, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ResumePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const canTailor = jobDescription.trim().length >= 50 && !loading;

  const handleTailor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canTailor) return;

    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      const data = (await response.json()) as {
        markdown?: string;
        error?: string;
      };

      if (!response.ok || !data.markdown) {
        throw new Error(data.error || "Unable to tailor the resume.");
      }

      setMarkdown(data.markdown);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to tailor the resume.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
  };

  const handleDownload = () => {
    const file = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "xianlong-min-tailored-resume.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-[calc(100vh-7.5rem)] bg-[#f2f0e9] p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl rise-in">
        <header className="mb-7 flex flex-col justify-between gap-5 border-b border-black/15 pb-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <Badge variant="accent" className="mb-3 w-fit">
              Career studio
            </Badge>
            <h1 className="font-(--font-fashion-display) text-4xl leading-tight md:text-5xl">
              Resume Tailor
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-black/60">
              Shape your verified experience around a role while keeping every
              claim grounded in your saved resume.
            </p>
          </div>
          <div className="flex items-center gap-3 border-l-2 border-[#d35b38] pl-4">
            <FileText className="size-5 text-[#a63d22]" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Xianlong Min</p>
              <p className="text-xs text-black/55">Source profile loaded</p>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <form
            onSubmit={handleTailor}
            className="flex min-h-152.5 flex-col border border-black/15 bg-[#fffdf8] shadow-[4px_4px_0_#1f1b16]"
          >
            <div className="border-b border-black/15 px-5 py-4">
              <p className="text-xs font-semibold uppercase text-[#a63d22]">
                01 / Target role
              </p>
              <h2 className="mt-1 text-xl font-semibold">Job description</h2>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <label htmlFor="job-description" className="mb-2 text-sm">
                Paste the full LinkedIn job description
              </label>
              <Textarea
                id="job-description"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste responsibilities, qualifications, and preferred skills here..."
                className="min-h-96 flex-1 resize-none border-black/20 bg-white leading-6"
                maxLength={30_000}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-black/50">
                <span>Minimum 50 characters</span>
                <span>{jobDescription.length.toLocaleString()} / 30,000</span>
              </div>
              {error ? (
                <p role="alert" className="mt-3 text-sm text-[#a52b1a]">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                size="lg"
                disabled={!canTailor}
                className="mt-5 w-full gap-2 bg-[#153d34] hover:bg-[#153d34]/90"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                {loading ? "Tailoring resume..." : "Tailor resume"}
              </Button>
            </div>
          </form>

          <section className="flex min-h-152.5 flex-col border border-black/15 bg-white">
            <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-black/15 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#16705c]">
                  02 / Tailored draft
                </p>
                <h2 className="mt-1 text-xl font-semibold">Markdown resume</h2>
              </div>
              {markdown ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={handleCopy}
                    title="Copy Markdown"
                    aria-label="Copy Markdown"
                  >
                    {copied ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : (
                      <Clipboard className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDownload}
                    className="gap-2"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download .md
                  </Button>
                </div>
              ) : (
                <Badge>Waiting for a role</Badge>
              )}
            </div>

            <div className="flex flex-1 overflow-auto p-5 md:p-7">
              {markdown ? (
                <article className="markdown-content resume-markdown w-full max-w-none text-sm leading-7">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdown}
                  </ReactMarkdown>
                </article>
              ) : (
                <div className="m-auto max-w-sm text-center">
                  <div className="mx-auto mb-5 flex size-14 items-center justify-center border border-dashed border-black/25 bg-[#f2f0e9]">
                    <FileText
                      className="size-6 text-black/45"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="font-(--font-fashion-display) text-2xl">
                    Your draft starts here
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/50">
                    Add the role on the left. Relevant skills and achievements
                    will be prioritized without changing the underlying facts.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
