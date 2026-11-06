# Candidate Knowledge Base Phase 1 Plan

## Objective

Build a normalized candidate knowledge base from `basic_resume.md` using Neon and Prisma.

The first phase focuses only on reliable candidate data. Semantic search, job comparison, and resume generation are postponed.

**Current status:** Phase 1, Phase 2, and Phase 3 database schemas and migrations are complete. Candidate data import (profile, work history, and skills) is still pending.

## Phase 1 schema

### `Candidate`

Stores the candidate’s basic profile.

- `id`
- `userId`
- `fullName`
- `headline`
- `email`
- `location`
- `websiteUrl`
- `linkedinUrl`
- `githubUrl`
- `createdAt`
- `updatedAt`

### `CandidateDocument`

Stores the original resume and future candidate source documents.

- `id`
- `candidateId`
- `documentType`
- `title`
- `sourcePath`
- `content`
- `version`
- `isActive`
- `createdAt`
- `updatedAt`

### `WorkExperience`

Stores companies, roles, dates, locations, and summaries.

- `id`
- `candidateId`
- `companyName`
- `jobTitle`
- `startDate`
- `endDate`
- `isCurrent`
- `location`
- `summary`
- `sortOrder`
- `sourceDocumentId`
- `createdAt`
- `updatedAt`

### `ExperienceEvidence`

Stores achievements, responsibilities, metrics, and technologies related to a work experience.

- `id`
- `experienceId`
- `content`
- `evidenceType`
- `metrics`
- `verified`
- `sourceDocumentId`
- `createdAt`

### `Skill`

Stores the shared skill dictionary.

- `id`
- `name`
- `normalizedName` (unique)
- `category`
- `createdAt`

### `CandidateSkill`

Connects a candidate to a skill and stores candidate-specific details. A candidate can link to a given skill only once (`candidateId` + `skillId` is unique).

- `id`
- `candidateId`
- `skillId`
- `proficiency`
- `yearsOfExperience`
- `lastUsedAt`
- `verified`
- `notes`
- `createdAt`
- `updatedAt`

### `SkillEvidence`

Stores evidence supporting a candidate’s skill. `experienceId` is optional so evidence can come from a specific role or from the resume at large.

- `id`
- `candidateSkillId`
- `experienceId`
- `content`
- `sourceDocumentId`
- `createdAt`

### `Education`

Stores degrees, institutions, fields of study, and dates.

- `id`
- `candidateId`
- `institution`
- `degree`
- `fieldOfStudy`
- `startDate`
- `endDate`
- `sourceDocumentId`
- `createdAt`
- `updatedAt`

## Relationships

```text
Candidate
├── CandidateDocument
├── WorkExperience
│   └── ExperienceEvidence
├── CandidateSkill
│   ├── Skill
│   └── SkillEvidence
└── Education
```

## Implementation phases

### Phase 1: Candidate profile — Complete

Target: create the candidate identity and source document.

- [x] Create `Candidate`.
- [ ] Import basic profile information.
- [ ] Store `basic_resume.md` in `CandidateDocument`.
- [x] Track document version and source path.

Migration applied: `20261030231412_add_candidate_profile_documents`

The migration creates:

- `Candidate`, including an optional `userId` and profile/contact fields.
- `CandidateDocument`, including document type, source path, content, version, and active status.
- A cascading relationship from `CandidateDocument` to `Candidate`.
- Indexes for candidate ownership and active document lookup.

### Phase 2: Work history — Complete

Target: represent employment history accurately.

- [x] Create `WorkExperience` records for each company and role.
- [x] Create `ExperienceEvidence` records for achievements and responsibilities.
- [x] Preserve the source document reference for each record.

Migration applied: `20261030232852_add_work_experience_evidence`

The migration creates:

- `WorkExperience`, linked to `Candidate` with optional source-document traceability.
- `ExperienceEvidence`, linked to `WorkExperience` and optionally to `CandidateDocument`.
- Cascade deletion from a candidate to work experiences and from a work experience to its evidence.
- Indexes for candidate work-history ordering and source-document lookup.

### Phase 3: Skills — Complete

Target: normalize and manage candidate skills.

- [x] Create canonical `Skill` records.
- [x] Connect the candidate through `CandidateSkill`.
- [x] Add supporting `SkillEvidence`.
- [x] Prevent duplicate skill names through normalized values.
- [ ] Import candidate skills from `basic_resume.md`.

Migration applied: `20261103230527_add_candidate_skills`

The migration creates:

- `Skill`, a shared dictionary with a unique `normalizedName` so the same skill cannot be inserted twice under different casing or spacing, plus an index on `category`.
- `CandidateSkill`, linking `Candidate` to `Skill` with a unique `(candidateId, skillId)` pair so a candidate cannot claim the same skill twice. Deleting a candidate cascades to their skills; deleting a `Skill` is restricted while any candidate references it.
- `SkillEvidence`, linked to `CandidateSkill` and optionally to `WorkExperience` and `CandidateDocument`. Evidence cascades with its candidate skill; the experience and source-document references are set to null if those records are removed.
- Indexes for candidate-skill lookup by skill, and evidence lookup by candidate skill, experience, and source document.

Notes:

- `CandidateSkill` includes `createdAt` and `updatedAt` because it is a mutable record (proficiency, years, and verification can change), in line with the Phase 5 timestamp requirement.
- `proficiency` is stored as free text for now; a controlled vocabulary can be introduced in Phase 5 if needed.

### Phase 4: Education

Target: store the candidate’s education history.

- Create `Education` records.
- Link each record to the candidate.
- Preserve source document references.

### Phase 5: Data quality

Target: ensure imported data is accurate and traceable.

- Validate required fields.
- Track source document references.
- Support candidate-confirmed evidence.
- Prevent duplicate experiences and skills.
- Add timestamps to mutable records.

## Deferred tables and features

These are intentionally postponed:

- `KnowledgeChunk`
- `Project`
- `ProjectTechnology`
- `JobDescription`
- `JobRequirement`
- `ResumeTailoringRun`
- `RequirementMatch`
- `RequirementMatchEvidence`
- `GeneratedResume`
- `GeneratedCoverLetter`

## Future semantic-search phase

When candidate data is stable, reintroduce `KnowledgeChunk` to support semantic retrieval:

1. Split normalized candidate data and source documents into chunks.
2. Generate embeddings.
3. Store vectors in Pinecone or pgvector.
4. Retrieve relevant candidate evidence for job-description matching.

## Initial definition of done

- [x] The Phase 1 candidate tables are stored in Neon through Prisma.
- [ ] `basic_resume.md` is preserved as a source document.
- [x] Work history is separated from individual evidence.
- [x] Skills are normalized and connected to the candidate.
- [ ] Education is stored independently.
- [x] Candidate documents can be traced back to their candidate.
- [x] No job-description, project, vector-search, or resume-generation tables are required in Phase 1.
