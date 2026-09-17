CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "profile" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT,
    "company" TEXT,
    "rawText" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SemanticChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "embedding" vector(1024) NOT NULL,
    "candidateProfileId" TEXT,
    "jobDescriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SemanticChunk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CandidateProfile_candidateId_version_key"
    ON "CandidateProfile"("candidateId", "version");
CREATE INDEX "CandidateProfile_candidateId_updatedAt_idx"
    ON "CandidateProfile"("candidateId", "updatedAt");
CREATE INDEX "JobDescription_company_createdAt_idx"
    ON "JobDescription"("company", "createdAt");
CREATE INDEX "SemanticChunk_candidateProfileId_ordinal_idx"
    ON "SemanticChunk"("candidateProfileId", "ordinal");
CREATE INDEX "SemanticChunk_jobDescriptionId_ordinal_idx"
    ON "SemanticChunk"("jobDescriptionId", "ordinal");
CREATE INDEX "SemanticChunk_embedding_hnsw_idx"
    ON "SemanticChunk" USING hnsw ("embedding" vector_cosine_ops);

ALTER TABLE "SemanticChunk"
    ADD CONSTRAINT "SemanticChunk_candidateProfileId_fkey"
    FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SemanticChunk"
    ADD CONSTRAINT "SemanticChunk_jobDescriptionId_fkey"
    FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
