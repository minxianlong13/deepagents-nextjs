import { Pinecone } from "@pinecone-database/pinecone";

// These must match the indexing side in apps/web/lib/tools/rag_search.ts and
// apps/web/lib/llm/model.js, otherwise query vectors will not line up.
const INDEX_NAME = process.env.RAG_PINECONE_INDEX ?? "aoe-langchain-docs";
const DOCUMENT_NAMESPACE = "documents";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1024;
// LangChain's PineconeStore stores chunk text under this metadata key.
const TEXT_KEY = "text";

let documentNamespace;

function getDocumentNamespace() {
  if (documentNamespace) return documentNamespace;

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) throw new Error("PINECONE_API_KEY is not configured");

  documentNamespace = new Pinecone({ apiKey })
    .index(INDEX_NAME)
    .namespace(DOCUMENT_NAMESPACE);
  return documentNamespace;
}

async function embedQuery(query) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const baseUrl = (
    process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      input: query,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(
      `OpenAI embeddings request failed (${response.status}): ${detail}`,
    );
  }

  const body = await response.json();
  const embedding = body?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error("OpenAI embeddings response did not include a vector");
  }
  return embedding;
}

export async function searchDocuments(query, topK) {
  const vector = await embedQuery(query);
  const result = await getDocumentNamespace().query({
    vector,
    topK,
    includeMetadata: true,
  });

  return (result.matches ?? []).map((match) => {
    const { [TEXT_KEY]: text, source, ...metadata } = match.metadata ?? {};
    return {
      id: match.id,
      score: match.score ?? null,
      source: typeof source === "string" ? source : "unknown",
      text: typeof text === "string" ? text : "",
      metadata,
    };
  });
}
