import { indexLangchainDocs } from "@/lib/tools/rag_search";
import { NextResponse } from "next/server";

export const maxDuration = 300;

let indexingPromise: Promise<{ documents: number; chunks: number }> | null =
  null;

export async function POST() {
  if (indexingPromise) {
    return NextResponse.json(
      { error: "Knowledge base indexing is already in progress." },
      { status: 409 },
    );
  }

  indexingPromise = indexLangchainDocs();

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
