import { indexKnowledgeBase } from "@/lib/tools/rag_search";
import { NextResponse } from "next/server";

export const maxDuration = 300;

let indexingPromise: Promise<{ documents: number; chunks: number }> | null =
  null;

export async function POST(request: Request) {
  if (indexingPromise) {
    return NextResponse.json(
      { error: "Knowledge base indexing is already in progress." },
      { status: 409 },
    );
  }

  let body: { folderName?: unknown } = {};
  try {
    body = (await request.json()) as { folderName?: unknown };
  } catch {
    // The validation below returns the user-facing error for missing input.
  }

  if (typeof body.folderName !== "string" || !body.folderName.trim()) {
    return NextResponse.json(
      { error: "A docs folder or subfolder is required, for example . or wiki/Passkey." },
      { status: 400 },
    );
  }

  indexingPromise = indexKnowledgeBase(body.folderName);

  try {
    const result = await indexingPromise;
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to initialize the knowledge base";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    indexingPromise = null;
  }
}
