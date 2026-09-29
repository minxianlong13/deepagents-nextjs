import "dotenv/config";

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { StateBackend } from "deepagents";
import { tool } from "langchain";
import { z } from "zod";

const DOCS_DIRECTORY = path.resolve(process.cwd(), "../../docs");
const REMOTE_METADATA_DIRECTORY = path.join(DOCS_DIRECTORY, "remote");
const DOCUMENT_NAMESPACE = "documents";
const MANIFEST_NAMESPACE = "rag-manifest";
const INDEX_NAME = "aoe-langchain-docs";
const MANIFEST_VECTOR = [1, ...Array(1023).fill(0)];

type SourceDocument = {
  source: string;
  content: string;
};

type RemoteMetadata = {
  sources: string[];
};

async function listLocalFiles(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((entry) => !entry.name.startsWith("."))
        .map((entry) => {
          const entryPath = path.join(directory, entry.name);
          return entry.isDirectory()
            ? listLocalFiles(entryPath)
            : Promise.resolve([entryPath]);
        }),
    );
    return files.flat();
  } catch {
    return [];
  }
}

function resolveDocsSubdirectory(folderName: string): string {
  const trimmedFolderName = folderName.trim();
  if (!trimmedFolderName) {
    throw new Error("A docs folder or subfolder is required");
  }

  const normalizedFolderName = [".", "./", "./docs", "docs"].includes(
    trimmedFolderName,
  )
    ? "."
    : trimmedFolderName;
  const docsSubdirectory = path.resolve(DOCS_DIRECTORY, normalizedFolderName);
  const docsPrefix = `${DOCS_DIRECTORY}${path.sep}`;
  if (
    docsSubdirectory !== DOCS_DIRECTORY &&
    !docsSubdirectory.startsWith(docsPrefix)
  ) {
    throw new Error("The selected folder must be inside ./docs");
  }

  return docsSubdirectory;
}

function isWithinDirectory(directory: string, filePath: string): boolean {
  const relativePath = path.relative(directory, filePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

async function loadRemoteMetadata(
  directory: string,
): Promise<RemoteMetadata[]> {
  const metadataFiles = (await listLocalFiles(directory)).filter(
    (filePath) => path.extname(filePath).toLowerCase() === ".json",
  );

  const metadata = await Promise.all(
    metadataFiles.map(async (filePath): Promise<RemoteMetadata | null> => {
      try {
        const parsed = JSON.parse(await readFile(filePath, "utf8")) as Partial<RemoteMetadata>;
        if (
          !Array.isArray(parsed.sources) ||
          !parsed.sources.every((source) => typeof source === "string")
        ) {
          return null;
        }
        return { sources: parsed.sources };
      } catch {
        return null;
      }
    }),
  );

  return metadata.filter((entry): entry is RemoteMetadata => entry !== null);
}

async function loadRemoteDocuments(
  directory: string,
): Promise<SourceDocument[]> {
  const metadata = await loadRemoteMetadata(directory);
  const remoteDocuments = await Promise.all(
    metadata.flatMap((entry) =>
      entry.sources.map(async (source) => {
        try {
          const response = await fetch(source);
          if (!response.ok) return null;
          return { source, content: await response.text() };
        } catch {
          return null;
        }
      }),
    ),
  );

  return remoteDocuments.filter(
    (document): document is SourceDocument => document !== null,
  );
}

async function loadSourceDocuments(folderName: string): Promise<SourceDocument[]> {
  const docsSubdirectory = resolveDocsSubdirectory(folderName);
  if (isWithinDirectory(REMOTE_METADATA_DIRECTORY, docsSubdirectory)) {
    const remoteDocuments = await loadRemoteDocuments(docsSubdirectory);
    if (remoteDocuments.length === 0) {
      throw new Error(
        `No readable remote sources were found under ./docs/${folderName}`,
      );
    }
    return remoteDocuments;
  }

  const localFiles = (await listLocalFiles(docsSubdirectory)).filter(
    (filePath) => !isWithinDirectory(REMOTE_METADATA_DIRECTORY, filePath),
  );
  const localDocuments = await Promise.all(
    localFiles
      .map(async (filePath) => {
        try {
          return {
            source: `local:${path.relative(DOCS_DIRECTORY, filePath)}`,
            content: await readFile(filePath, "utf8"),
          };
        } catch {
          return null;
        }
      }),
  );

  const documents = localDocuments.filter(
    (document): document is SourceDocument => document !== null,
  );
  if (docsSubdirectory === DOCS_DIRECTORY) {
    const remoteDocuments = await loadRemoteDocuments(REMOTE_METADATA_DIRECTORY);
    documents.push(...remoteDocuments);
  }
  if (documents.length === 0) {
    throw new Error(`No readable documents were found under ./docs/${folderName}`);
  }
  return documents;
}

async function loadDocuments(folderName: string): Promise<Document[]> {
  const sources = await loadSourceDocuments(folderName);
  const docs: Document[] = [];
  sources.forEach(({ source, content }) => {
    docs.push(new Document({ pageContent: content, metadata: { source } }));
  });
  console.log(`Loaded ${docs.length} personal knowledge sources.`);
  return docs;
}

async function splitDocuments(documents: Document[]): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splitDocs = await splitter.splitDocuments(documents);
  console.log(`Split into ${splitDocs.length} chunks.`);
  return splitDocs;
}

async function createVectorStore() {
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    dimensions: 1024,
  });

  const pineconeApiKey = process.env.PINECONE_API_KEY;
  if (!pineconeApiKey) {
    throw new Error("PINECONE_API_KEY is not set");
  }

  const pinecone = new PineconeClient({
    apiKey: pineconeApiKey,
  });
  const pineconeIndex = pinecone.Index(INDEX_NAME);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: DOCUMENT_NAMESPACE,
  });

  return vectorStore;
}

let vectorStore: Awaited<ReturnType<typeof createVectorStore>> | undefined;

async function getVectorStore() {
  vectorStore ??= await createVectorStore();
  return vectorStore;
}

export async function indexKnowledgeBase(folderName: string) {
  const documents = await loadDocuments(folderName);
  const vectorStore = await getVectorStore();
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  if (!pineconeApiKey) throw new Error("PINECONE_API_KEY is not set");

  const pineconeIndex = new PineconeClient({ apiKey: pineconeApiKey }).Index(
    INDEX_NAME,
  );
  const manifestNamespace = pineconeIndex.namespace(MANIFEST_NAMESPACE);
  let indexedSources = 0;
  let skippedSources = 0;
  let indexedChunks = 0;
  const batchSize = 8;

  for (const document of documents) {
    const source = String(document.metadata.source);
    const sourceHash = createHash("sha256")
      .update(document.pageContent)
      .digest("hex");
    const manifestId = createHash("sha256").update(source).digest("hex");
    const existing = await manifestNamespace.fetch([manifestId]);
    const existingMetadata = existing.records?.[manifestId]?.metadata as
      | { hash?: string; chunkIds?: string[] }
      | undefined;

    if (existingMetadata?.hash === sourceHash) {
      skippedSources += 1;
      continue;
    }

    if (existingMetadata?.chunkIds?.length) {
      await pineconeIndex
        .namespace(DOCUMENT_NAMESPACE)
        .deleteMany(existingMetadata.chunkIds);
    }

    const chunks = await splitDocuments([document]);
    const chunkIds = chunks.map((_, index) => `${manifestId}-${index}`);
    for (let index = 0; index < chunks.length; index += batchSize) {
      const batch = chunks.slice(index, index + batchSize);
      await vectorStore.addDocuments(batch, {
        ids: chunkIds.slice(index, index + batch.length),
      });

      if (index + batchSize < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
      }
    }

    await manifestNamespace.upsert([
      {
        id: manifestId,
        values: MANIFEST_VECTOR,
        metadata: { source, hash: sourceHash, chunkIds },
      },
    ]);
    indexedSources += 1;
    indexedChunks += chunks.length;
  }

  console.log(
    `Indexed ${indexedSources} changed sources and skipped ${skippedSources}.`,
  );
  return {
    documents: indexedSources,
    chunks: indexedChunks,
    skipped: skippedSources,
  };
}

export const backend = new StateBackend();

export const documentSearch = tool(
  async ({ query }) => {
    const vectorStore = await getVectorStore();
    const retrievedDocs = await vectorStore.similaritySearch(query, 4);
    const batchId = crypto.randomUUID().slice(0, 8);
    const uploads: Array<[string, Uint8Array]> = [];
    const savedPaths: string[] = [];
    const encoder = new TextEncoder();

    retrievedDocs.forEach((doc, index) => {
      const path = `/retrieved/${batchId}/chunk_${index + 1}.md`;
      const content = `# Source: ${doc.metadata.source ?? "unknown"}\n\n${doc.pageContent}`;
      uploads.push([path, encoder.encode(content)]);
      savedPaths.push(path);
    });

    backend.uploadFiles(uploads);
    return `Saved ${savedPaths.length} documentation chunks:\n${savedPaths.join("\n")}`;
  },
  {
    name: "document_search",
    description:
      "Search the personal knowledge base and save matching chunks to the agent filesystem.",
    schema: z.object({
      query: z.string().describe("Natural language search query."),
    }),
  },
);
