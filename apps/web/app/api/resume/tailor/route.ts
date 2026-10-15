import { NextResponse } from "next/server";
import { z } from "zod";
import { runResumeTailorWorkflow } from "@/lib/workflow/resume_tailor";

const requestSchema = z.object({
  jobDescription: z.string().trim().min(50).max(30_000),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Paste a job description with at least 50 characters before tailoring.",
        },
        { status: 400 },
      );
    }

    const result = await runResumeTailorWorkflow(parsed.data.jobDescription);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to tailor the resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
