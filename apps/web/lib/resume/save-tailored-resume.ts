import { mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

function toFileNamePart(value: string | null, fallback: string) {
  const safePart = value
    ?.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

  return safePart || fallback;
}

export async function saveTailoredResume(
  markdown: string,
  companyName: string | null,
  jobTitle: string | null,
  outputDirectory = join(process.cwd(), "generated-resumes"),
) {
  const company = toFileNamePart(companyName, "Company_Not_Specified");
  const role = toFileNamePart(jobTitle, "Role_Not_Specified");
  const fileName = `Xianlong_Min_${company}_${role}.md`;
  const absolutePath = join(outputDirectory, fileName);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(absolutePath, markdown, "utf8");

  return {
    fileName,
    filePath: relative(process.cwd(), absolutePath),
  };
}
