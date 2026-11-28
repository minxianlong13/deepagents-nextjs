import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isChatModelId,
  MODEL_CATALOG,
  MODEL_SELECTION_DEFAULTS,
} from "@/lib/llm/catalog";

const RESUME_COOKIE = "aoe-resume-model";
const COVER_LETTER_COOKIE = "aoe-cover-letter-model";

const selectionSchema = z.object({
  resumeTailoring: z.string(),
  coverLetter: z.string(),
});

function getSelection(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const resumeTailoring = cookieStore.get(RESUME_COOKIE)?.value;
  const coverLetter = cookieStore.get(COVER_LETTER_COOKIE)?.value;

  return {
    resumeTailoring: isChatModelId(resumeTailoring)
      ? resumeTailoring
      : MODEL_SELECTION_DEFAULTS.resumeTailoring,
    coverLetter: isChatModelId(coverLetter)
      ? coverLetter
      : MODEL_SELECTION_DEFAULTS.coverLetter,
  };
}

export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json({ models: MODEL_CATALOG, selection: getSelection(cookieStore) });
}

export async function POST(request: Request) {
  const parsed = selectionSchema.safeParse(await request.json());
  if (
    !parsed.success ||
    !isChatModelId(parsed.data.resumeTailoring) ||
    !isChatModelId(parsed.data.coverLetter)
  ) {
    return NextResponse.json(
      { error: "Select an available model for both workflows." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ selection: parsed.data });
  response.cookies.set(RESUME_COOKIE, parsed.data.resumeTailoring, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  response.cookies.set(COVER_LETTER_COOKIE, parsed.data.coverLetter, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
