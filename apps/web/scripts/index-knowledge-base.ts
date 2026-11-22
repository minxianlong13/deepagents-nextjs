// Index ./docs (or a subfolder) into Pinecone outside the Next.js route, which
// is limited to 300 seconds.
//
//   pnpm index:kb                 index everything under ./docs
//   pnpm index:kb wiki/Passkey    index one subfolder
//
// RAG_DOCUMENT_NAMESPACE and RAG_MANIFEST_NAMESPACE choose the target namespaces.

import { indexKnowledgeBase } from "../lib/tools/rag_search";

async function main() {
  const folder = process.argv[2] ?? ".";
  const started = Date.now();

  console.log(
    `Indexing ./docs/${folder} into namespace "${process.env.RAG_DOCUMENT_NAMESPACE ?? "documents-v2"}"`,
  );
  const result = await indexKnowledgeBase(folder);
  console.log(
    `Done in ${Math.round((Date.now() - started) / 1000)}s:`,
    JSON.stringify(result),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
