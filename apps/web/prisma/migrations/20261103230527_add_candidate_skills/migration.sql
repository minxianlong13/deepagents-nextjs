-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSkill" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiency" TEXT,
    "yearsOfExperience" DOUBLE PRECISION,
    "lastUsedAt" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEvidence" (
    "id" TEXT NOT NULL,
    "candidateSkillId" TEXT NOT NULL,
    "experienceId" TEXT,
    "content" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_normalizedName_key" ON "Skill"("normalizedName");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "CandidateSkill_skillId_idx" ON "CandidateSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateSkill_candidateId_skillId_key" ON "CandidateSkill"("candidateId", "skillId");

-- CreateIndex
CREATE INDEX "SkillEvidence_candidateSkillId_idx" ON "SkillEvidence"("candidateSkillId");

-- CreateIndex
CREATE INDEX "SkillEvidence_experienceId_idx" ON "SkillEvidence"("experienceId");

-- CreateIndex
CREATE INDEX "SkillEvidence_sourceDocumentId_idx" ON "SkillEvidence"("sourceDocumentId");

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_candidateSkillId_fkey" FOREIGN KEY ("candidateSkillId") REFERENCES "CandidateSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "WorkExperience"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "CandidateDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
