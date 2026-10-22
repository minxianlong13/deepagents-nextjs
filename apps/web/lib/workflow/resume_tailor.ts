import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  runCoverLetterAgent,
  runResumeTailorAgent,
  type ResumeTailorResult,
} from "@/lib/agents/tailor_resume_agents";

export type ResumeTailorWorkflowResult = ResumeTailorResult & {
  fileName: string;
  filePath: string;
  coverLetter: string;
  coverLetterFileName: string;
  coverLetterFilePath: string;
};

function toFileNamePart(value: string | null, fallback: string) {
  const safePart = value
    ?.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

  return safePart || fallback;
}

async function saveMarkdown(fileName: string, markdown: string) {
  const outputDirectory = join(process.cwd(), "generated-resumes");
  const absolutePath = join(outputDirectory, fileName);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(absolutePath, markdown, "utf8");

  return {
    fileName,
    filePath: relative(process.cwd(), absolutePath),
  };
}

export async function runResumeTailorWorkflow(
  jobDescription: string,
): Promise<ResumeTailorWorkflowResult> {
  const masterResume = await readFile(
    new URL("../resume/basic_resume.md", import.meta.url),
    "utf8",
  );

  const result = await runResumeTailorAgent(masterResume, jobDescription);
  const company = toFileNamePart(result.companyName, "Company_Not_Specified");
  const role = toFileNamePart(result.jobTitle, "Role_Not_Specified");
  const resumeFile = await saveMarkdown(
    `Xianlong_Min_Resume_${company}_${role}.md`,
    result.tailoredResume,
  );

  const coverLetter = await runCoverLetterAgent({
    masterResume,
    jobDescription,
    companyName: result.companyName,
    jobTitle: result.jobTitle,
    tailoredResume: result.tailoredResume,
  });
  const coverLetterFile = await saveMarkdown(
    `Xianlong_Min_CoverLetter_${company}_${role}.md`,
    coverLetter,
  );

  return {
    ...result,
    fileName: resumeFile.fileName,
    filePath: resumeFile.filePath,
    coverLetter,
    coverLetterFileName: coverLetterFile.fileName,
    coverLetterFilePath: coverLetterFile.filePath,
  };
}
