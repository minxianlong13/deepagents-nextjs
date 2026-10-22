"use client";

import { useState } from "react";
import {
  Check,
  Clipboard,
  Download,
  FileDown,
  FileText,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ResumeTailorResult } from "@/lib/agents/tailor_resume_agents";

export default function ResumePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [analysis, setAnalysis] = useState<ResumeTailorResult | null>(null);
  const [savedFilePath, setSavedFilePath] = useState("");
  const [savedCoverLetterPath, setSavedCoverLetterPath] = useState("");
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
    setSavedFilePath("");
    setSavedCoverLetterPath("");
    setAnalysis(null);
    setCoverLetter("");

    try {
      const response = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      const data = (await response.json()) as {
        companyName?: string | null;
        jobTitle?: string | null;
        requirements?: ResumeTailorResult["requirements"];
        tailoredResume?: string;
        coverLetter?: string;
        missingRequirements?: string[];
        changes?: string[];
        fileName?: string;
        filePath?: string;
        coverLetterFileName?: string;
        coverLetterFilePath?: string;
        error?: string;
      };

      if (!response.ok || !data.tailoredResume) {
        throw new Error(data.error || "Unable to tailor the resume.");
      }

      setMarkdown(data.tailoredResume);
      setCoverLetter(data.coverLetter ?? "");
      setAnalysis({
        companyName: data.companyName ?? null,
        jobTitle: data.jobTitle ?? null,
        requirements: data.requirements ?? [],
        tailoredResume: data.tailoredResume,
        missingRequirements: data.missingRequirements ?? [],
        changes: data.changes ?? [],
      });
      setSavedFilePath(data.filePath ?? data.fileName ?? "");
      setSavedCoverLetterPath(
        data.coverLetterFilePath ?? data.coverLetterFileName ?? "",
      );
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
    anchor.download = savedFilePath.split("/").at(-1) ?? "tailored-resume.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printAsPdf = (
    contentSelector: string,
    filePath: string,
    fallbackFileName: string,
    frameTitle: string,
  ) => {
    const content = document.querySelector(contentSelector);
    if (!content) return;

    const markdownFileName = filePath.split("/").at(-1);
    const pdfFileName = markdownFileName
      ? markdownFileName.replace(/\.md$/i, ".pdf")
      : fallbackFileName;
    const originalDocumentTitle = document.title;
    const pdfTitle = pdfFileName
      .replace(/\.pdf$/i, "")
      .replace(/^Xianlong_Min_(?:Resume|CoverLetter)_/i, "Xianlong_Min_");
    const printFrame = document.createElement("iframe");
    printFrame.setAttribute("aria-hidden", "true");
    printFrame.title = frameTitle;
    Object.assign(printFrame.style, {
      position: "fixed",
      width: "1px",
      height: "1px",
      right: "0",
      bottom: "0",
      border: "0",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.append(printFrame);

    const printDocument = printFrame.contentDocument;
    const printWindow = printFrame.contentWindow;
    if (!printDocument || !printWindow) {
      printFrame.remove();
      setError("Unable to prepare the PDF print view.");
      return;
    }

    printDocument.open();
    printDocument.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title></title>
          <style>
            @page { size: letter; margin: 0.65in; }
            html, body { margin: 0; padding: 0; background: #fff; }
            body { color: #111; font: 10pt/1.35 Arial, Helvetica, sans-serif; }
            h1 { margin: 0 0 0.65rem; border-bottom: 2px solid #222; padding-bottom: 0.5rem; font: 22pt/1.15 Georgia, serif; }
            h2 { margin: 1rem 0 0.4rem; border-bottom: 1px solid #ccc; padding-bottom: 0.2rem; font-size: 10pt; break-after: avoid; }
            h3 { break-after: avoid; }
            p, ul, ol, blockquote { margin: 0.45rem 0; }
            ul, ol { padding-left: 1.2rem; }
            li { break-inside: avoid; }
            a { color: #111; text-decoration: underline; }
            pre { white-space: pre-wrap; overflow-wrap: anywhere; }
          </style>
        </head>
        <body><main></main></body>
      </html>`);
    printDocument.close();
    printDocument.title = pdfFileName;
    const printRoot = printDocument.querySelector("main");
    if (!printRoot) {
      printFrame.remove();
      setError("Unable to prepare the PDF print view.");
      return;
    }
    printRoot.innerHTML = content.innerHTML;
    printWindow.addEventListener(
      "afterprint",
      () => {
        document.title = originalDocumentTitle;
        printFrame.remove();
      },
      { once: true },
    );
    printWindow.requestAnimationFrame(() => {
      document.title = pdfTitle;
      printWindow.focus();
      printWindow.print();
    });
  };

  const handleSavePdf = () => {
    printAsPdf(
      ".resume-print-content .resume-markdown",
      savedFilePath,
      "Xianlong_Min_Tailored_Resume.pdf",
      "Resume PDF print view",
    );
  };

  const handleDownloadCoverLetter = () => {
    const file = new Blob([coverLetter], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      savedCoverLetterPath.split("/").at(-1) ?? "cover-letter.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCoverLetterPdf = () => {
    printAsPdf(
      ".cover-letter-print-content",
      savedCoverLetterPath,
      "Xianlong_Min_CoverLetter.pdf",
      "Cover letter PDF print view",
    );
  };

  return (
    <main className="resume-page min-h-[calc(100vh-7.5rem)] bg-[#f2f0e9] px-4 py-7 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-5xl rise-in">
        <header className="mb-7 border-b border-black/15 pb-6">
          <p className="mb-2 text-xs font-semibold uppercase text-[#a63d22]">
            Career studio / Resume tailor
          </p>
          <h1 className="font-(--font-fashion-display) text-4xl leading-tight md:text-5xl">
            Tailor your resume
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">
            Paste a job description. Your saved profile supplies the evidence;
            the finished Markdown is saved locally after generation.
          </p>
        </header>

        <form
          onSubmit={handleTailor}
          className="border border-black/15 border-t-4 border-t-[#16705c] bg-[#fffdf8] p-4 shadow-[4px_4px_0_#1f1b16] md:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <label
                htmlFor="job-description"
                className="text-lg font-semibold"
              >
                Job description
              </label>
              <p className="mt-1 text-sm text-black/55">
                Include responsibilities, qualifications, and preferred skills.
              </p>
            </div>
            <FileText
              className="mt-1 size-5 shrink-0 text-[#16705c]"
              aria-hidden="true"
            />
          </div>
          <Textarea
            id="job-description"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the full job description here..."
            className="min-h-64 resize-y border-black/20 bg-white leading-6 md:min-h-72"
            maxLength={30_000}
            required
            aria-describedby="job-description-hint job-description-count"
          />
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-black/55">
            <span id="job-description-hint">At least 50 characters</span>
            <span id="job-description-count">
              {jobDescription.length.toLocaleString()} / 30,000
            </span>
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-[#a52b1a]">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col-reverse gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-black/50">
              Only supported experience and skills will be included.
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={!canTailor}
              className="w-full gap-2 bg-[#153d34] hover:bg-[#153d34]/90 sm:w-auto"
            >
              {loading ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {loading ? "Tailoring resume..." : "Generate tailored resume"}
            </Button>
          </div>
        </form>

        {analysis ? (
          <section className="mt-6 border border-black/15 bg-[#e7f1ec] p-4 md:p-5">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase text-[#16705c]">
                Job description analysis
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                Extracted role requirements
              </h2>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-black/50">
                  Company
                </dt>
                <dd className="mt-1 text-sm">
                  {analysis.companyName ?? "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-black/50">
                  Position
                </dt>
                <dd className="mt-1 text-sm">
                  {analysis.jobTitle ?? "Not specified"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-black/50">
                  Job requirements
                </dt>
                <dd className="mt-1 text-sm leading-6">
                  {analysis.requirements.length
                    ? analysis.requirements
                        .map(
                          (requirement) =>
                            `${requirement.term} (${requirement.importance})`,
                        )
                        .join(" · ")
                    : "No requirements identified"}
                </dd>
              </div>
            </dl>
            <div className="mt-4 overflow-x-auto border-t border-black/10 pt-4">
              <h3 className="mb-2 text-sm font-semibold">Evidence match</h3>
              <table className="w-full min-w-[38rem] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-black/15 text-black/55">
                    <th className="py-2 pr-3 font-semibold">Requirement</th>
                    <th className="py-2 pr-3 font-semibold">Importance</th>
                    <th className="py-2 pr-3 font-semibold">Match</th>
                    <th className="py-2 font-semibold">Resume evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.requirements.map((requirement, index) => (
                    <tr
                      key={`${requirement.term}-${index}`}
                      className="border-b border-black/10 align-top last:border-0"
                    >
                      <td className="py-2 pr-3 font-medium">
                        {requirement.term}
                      </td>
                      <td className="py-2 pr-3">{requirement.importance}</td>
                      <td className="py-2 pr-3">
                        {requirement.supported ? "Supported" : "Missing"}
                      </td>
                      <td className="py-2">
                        {requirement.evidence.length
                          ? requirement.evidence.join("; ")
                          : "No supporting evidence"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {analysis.missingRequirements.length ? (
              <div className="mt-4 border-t border-black/10 pt-4">
                <h3 className="text-sm font-semibold">
                  Unsupported requirements
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {analysis.missingRequirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {analysis.changes.length ? (
              <div className="mt-4 border-t border-black/10 pt-4">
                <h3 className="text-sm font-semibold">Tailoring decisions</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {analysis.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <details className="mt-4 border-t border-black/10 pt-3">
              <summary className="cursor-pointer text-xs font-semibold text-[#153d34]">
                View extracted JSON
              </summary>
              <pre className="mt-3 overflow-x-auto bg-white/70 p-3 text-xs leading-5">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </details>
          </section>
        ) : null}

        <section className="resume-printable mt-7 overflow-hidden border border-black/15 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/15 px-4 py-4 md:px-6">
            <div>
              <p className="text-xs font-semibold uppercase text-[#16705c]">
                Tailored draft
              </p>
              <h2 className="mt-1 text-xl font-semibold">Resume preview</h2>
            </div>
            {markdown ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={handleCopy}
                  title={copied ? "Copied Markdown" : "Copy Markdown"}
                  aria-label={copied ? "Copied Markdown" : "Copy Markdown"}
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
                  Download Markdown
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePdf}
                  className="gap-2 bg-[#153d34] hover:bg-[#153d34]/90"
                >
                  <FileDown className="size-4" aria-hidden="true" />
                  Save as PDF
                </Button>
              </div>
            ) : null}
          </div>

          {savedFilePath ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-wrap items-center gap-2 border-b border-[#16705c]/20 bg-[#e7f1ec] px-4 py-3 text-sm text-[#153d34] md:px-6"
            >
              <Check className="size-4 shrink-0" aria-hidden="true" />
              <span>Saved locally:</span>
              <code className="break-all font-mono text-xs">
                {savedFilePath}
              </code>
            </div>
          ) : null}

          <div className="resume-print-content min-h-72 p-5 md:min-h-96 md:p-8">
            {markdown ? (
              <article className="markdown-content resume-markdown mx-auto w-full max-w-3xl text-sm leading-7">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </article>
            ) : (
              <div className="flex min-h-60 flex-col items-center justify-center text-center">
                <div className="mb-4 flex size-12 items-center justify-center border border-dashed border-black/25 bg-[#f2f0e9]">
                  <FileText
                    className="size-5 text-black/45"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-(--font-fashion-display) text-2xl">
                  Your draft will appear here
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-black/50">
                  Paste a job description above to create and save a tailored
                  Markdown resume.
                </p>
              </div>
            )}
          </div>
        </section>

        {coverLetter ? (
          <section className="mt-6 overflow-hidden border border-black/15 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/15 px-4 py-4 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase text-[#a63d22]">
                  Application letter
                </p>
                <h2 className="mt-1 text-xl font-semibold">Cover letter</h2>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleDownloadCoverLetter}
                className="gap-2"
              >
                <Download className="size-4" aria-hidden="true" />
                Download Markdown
              </Button>
              <Button
                type="button"
                onClick={handleSaveCoverLetterPdf}
                className="gap-2 bg-[#153d34] hover:bg-[#153d34]/90"
              >
                <FileDown className="size-4" aria-hidden="true" />
                Save as PDF
              </Button>
            </div>
            {savedCoverLetterPath ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-wrap items-center gap-2 border-b border-[#16705c]/20 bg-[#e7f1ec] px-4 py-3 text-sm text-[#153d34] md:px-6"
              >
                <Check className="size-4 shrink-0" aria-hidden="true" />
                <span>Saved locally:</span>
                <code className="break-all font-mono text-xs">
                  {savedCoverLetterPath}
                </code>
              </div>
            ) : null}
            <article className="cover-letter-print-content markdown-content resume-markdown mx-auto w-full max-w-3xl p-5 text-sm leading-7 md:p-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {coverLetter}
              </ReactMarkdown>
            </article>
          </section>
        ) : null}
      </div>
    </main>
  );
}
