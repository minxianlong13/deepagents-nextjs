import "dotenv/config";

import { randomUUID } from "node:crypto";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { tool } from "langchain";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { candidateProfile } from "@/lib/resume/candidate-profile";

const EMBEDDING_DIMENSIONS = 1024;
const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function createEvidenceDocuments(): Document[] {
  return candidateProfile.career_evidence.map((evidence) => {
    return new Document({
      pageContent: [
        `Evidence ID: ${evidence.id}`,
        `Company: ${evidence.company}`,
        `Role: ${evidence.role}`,
        `Category: ${evidence.category}`,
        JSON.stringify(evidence, null, 2),
      ].join("\n"),
      metadata: {
        evidenceId: evidence.id,
        company: evidence.company,
        category: evidence.category,
      },
    });
  });
}

export async function splitProfile(): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const chunks = await splitter.splitDocuments(createEvidenceDocuments());

  return chunks.map((chunk) => {
    const evidenceId = String(chunk.metadata.evidenceId);
    const evidencePrefix = `Evidence ID: ${evidenceId}`;

    return chunk.pageContent.startsWith(evidencePrefix)
      ? chunk
      : new Document({
          pageContent: `${evidencePrefix}\n${chunk.pageContent}`,
          metadata: chunk.metadata,
        });
  });
}

async function createEmbeddings() {
  return new OpenAIEmbeddings({
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
  });
}

export async function indexCandidateProfile(version = 1) {
  const chunks = await splitProfile();
  const embeddings = await createEmbeddings();
  const vectors = await embeddings.embedDocuments(
    chunks.map((chunk) => chunk.pageContent),
  );
  const candidateId = candidateProfile.candidate.contact.email.toLowerCase();
  const profileId = randomUUID();

  return prisma.$transaction(async (transaction) => {
    const profileRecords = await transaction.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "CandidateProfile" (
        "id",
        "candidateId",
        "version",
        "profile",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${profileId},
        ${candidateId},
        ${version},
        ${JSON.stringify(candidateProfile)}::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("candidateId", "version") DO UPDATE SET
        "profile" = EXCLUDED."profile",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id"
    `;

    const storedProfileId = profileRecords[0]?.id;
    if (!storedProfileId) {
      throw new Error("Unable to create the candidate profile record.");
    }

    await transaction.$executeRaw`
      DELETE FROM "SemanticChunk"
      WHERE "candidateProfileId" = ${storedProfileId}
    `;

    for (const [ordinal, chunk] of chunks.entries()) {
      const vector = vectors[ordinal];
      if (!vector) {
        throw new Error(`Missing embedding for profile chunk ${ordinal}.`);
      }

      await transaction.$executeRaw`
        INSERT INTO "SemanticChunk" (
          "id",
          "content",
          "ordinal",
          "embedding",
          "candidateProfileId",
          "createdAt"
        )
        VALUES (
          ${randomUUID()},
          ${chunk.pageContent},
          ${ordinal},
          ${JSON.stringify(vector)}::vector,
          ${storedProfileId},
          CURRENT_TIMESTAMP
        )
      `;
    }

    return {
      profileId: storedProfileId,
      version,
      chunks: chunks.length,
      dimensions: EMBEDDING_DIMENSIONS,
    };
  });
}

export const resumeTailor = tool(
  async ({ version }) => {
    const result = await indexCandidateProfile(version);
    return `Indexed candidate profile ${result.profileId} version ${result.version} with ${result.chunks} vector chunks.`;
  },
  {
    name: "index_candidate_profile",
    description:
      "Split the structured candidate profile into sections, generate embeddings, and store the profile and vector chunks in PostgreSQL with pgvector.",
    schema: z.object({
      version: z
        .number()
        .int()
        .positive()
        .default(1)
        .describe("Candidate profile version to replace or create."),
    }),
  },
);
