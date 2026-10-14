import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

export async function saveTailoredResume(
  markdown: string,
  outputDirectory = join(process.cwd(), "generated-resumes"),
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `xianlong-min-tailored-resume-${timestamp}-${randomUUID().slice(0, 8)}.md`;
  const absolutePath = join(outputDirectory, fileName);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(absolutePath, markdown, { encoding: "utf8", flag: "wx" });

  return {
    fileName,
    filePath: relative(process.cwd(), absolutePath),
  };
}
