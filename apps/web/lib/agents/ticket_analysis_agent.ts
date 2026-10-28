import { createDeepAgent } from "deepagents";
import { createAgent, tool, toolStrategy } from "langchain";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { createDeterministicGPT6LunaModel } from "../llm/model.js";
import { captureDocumentationSearch } from "../tools/rag_search";
import {
  assessmentSchema,
  evidenceBundleSchema,
  boundEvidence,
  validateCitations,
  validateClaimText,
  EvidenceValidationError,
  makeSearchAttempt,
  type EvidenceItem,
  type SearchAttempt,
} from "../workflow/ticket_evidence";
import {
  TICKET_TECHNICAL_ANALYSIS_PROMPT,
  TICKET_ANALYSIS_REPAIR_PROMPT,
} from "../skill/jira_analysis";
import {
  ticketContractSchema,
  type TicketContract,
} from "./ticket_contract_agent";
import type { JiraTicketGetAgentResult } from "./get_jira_ticket_agent";
import type { SlackSearchAgentResult } from "./slack_search_agent";

type EvidenceBackedJiraTicket = JiraTicketGetAgentResult & {
  keywords: string[];
  evidence: EvidenceItem[];
};

const ticketDetailsSchema = z.object({
  key: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  component: z.string(),
});

const rootCauseSchema = z.object({
  assessment: z.string(),
  confidence: z.enum(["high", "medium", "low", "insufficient evidence"]),
  evidence: z.array(z.string()),
  hypotheses: z.array(z.string()),
});

const documentationReferenceSchema = z.object({
  evidenceId: z.string(),
  source: z.string(),
  relevance: z.string(),
});

export const ticketTechnicalAnalysisSchema = z
  .object({
    workflowContract: ticketContractSchema,
    ticketDetails: ticketDetailsSchema,
    problemIdentification: z.object({
      expectedBehavior: z.string(),
      actualBehavior: z.string(),
      reproductionSteps: z.array(z.string()),
    }),
    componentOrProject: z.string(),
    rootCause: rootCauseSchema,
    recommendedSolution: z.string(),
    implementationSteps: z.array(z.string()),
    risksAndDependencies: z.array(z.string()),
    validationStrategy: z.array(z.string()),
    relatedDocumentation: z.array(documentationReferenceSchema),
    codeAgentPrompt: z.string().min(1),
  })
  .extend(assessmentSchema.shape)
  .extend(evidenceBundleSchema.shape)
  .extend({
    limitations: z.array(z.string()).max(30),
  });

export type TicketTechnicalAnalysis = z.infer<
  typeof ticketTechnicalAnalysisSchema
>;

export type SlackTicketContext = SlackSearchAgentResult;

const synthesisSchema = ticketTechnicalAnalysisSchema.omit({
  evidence: true,
  searches: true,
  limitations: true,
});

export function createDocumentationResearchSession(
  initialEvidence: EvidenceItem[],
  retrieve: typeof captureDocumentationSearch = captureDocumentationSearch,
) {
  let evidence = boundEvidence(initialEvidence);
  const searches: SearchAttempt[] = [];
  const queries = new Set<string>();
  let attempts = 0;
  const documentTool = tool(
    async ({ query, reason }) => {
      const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
      if (/^(?:group|prod)-\d+$/i.test(normalized))
        throw new Error(
          "Search using technical context, not only a ticket key.",
        );
      if (attempts >= 3)
        throw new Error(
          "Documentation search budget exhausted (three attempts maximum).",
        );
      if (queries.has(normalized))
        throw new Error("Equivalent documentation query already searched.");
      if (attempts && (!reason || reason.trim().length < 10))
        throw new Error("Explain the gap requiring a different query.");
      if (searches.at(-1)?.errorCode === "auth_required")
        throw new Error("Do not retry an authentication failure.");
      queries.add(normalized);
      attempts += 1;
      const capture = await retrieve({
        query,
        attempt: attempts,
        refinementOf: searches[0]?.id ?? null,
        reason: reason ?? "Initial focused documentation search",
      });
      const merged = boundEvidence([...evidence, ...capture.evidence]);
      const ids = new Set(merged.map((item) => item.id));
      const kept = capture.evidence.filter((item) => ids.has(item.id));
      if (kept.length < capture.evidence.length) {
        capture.search.outcome = "partial";
        capture.search.truncated = true;
      }
      capture.search.evidenceIds = kept.map((item) => item.id);
      evidence = merged;
      searches.push(capture.search);
      return JSON.stringify({ evidence: kept, search: capture.search });
    },
    {
      name: "document_search",
      description:
        "Search project documentation and return captured excerpts with source IDs. At most three focused queries.",
      schema: z.object({
        query: z.string().trim().min(3).max(2000),
        reason: z.string().max(1000).optional(),
      }),
    },
  );
  return { documentTool, searches, getEvidence: () => evidence };
}

export function analysisCitationErrors(
  result: z.infer<typeof synthesisSchema>,
  evidence: EvidenceItem[],
  contract: TicketContract,
): string[] {
  const targets = [
    "ticketDetails.key",
    "ticketDetails.title",
    "ticketDetails.summary",
    "ticketDetails.description",
    "ticketDetails.component",
    "componentOrProject",
    "problemIdentification.expectedBehavior",
    "problemIdentification.actualBehavior",
    "rootCause.assessment",
    "recommendedSolution",
    ...result.problemIdentification.reproductionSteps.map(
      (_, index) => `problemIdentification.reproductionSteps[${index}]`,
    ),
    ...result.rootCause.evidence.map(
      (_, index) => `rootCause.evidence[${index}]`,
    ),
    ...result.rootCause.hypotheses.map(
      (_, index) => `rootCause.hypotheses[${index}]`,
    ),
    ...result.implementationSteps.map(
      (_, index) => `implementationSteps[${index}]`,
    ),
    ...result.risksAndDependencies.map(
      (_, index) => `risksAndDependencies[${index}]`,
    ),
  ];
  const errors = validateCitations(result, evidence, targets);
  errors.push(...validateClaimText(result.claims, result));
  if (result.ticketDetails.key !== contract.ticketKey)
    errors.push("Ticket key mismatch in final analysis.");
  if (
    result.rootCause.confidence === "high" &&
    !result.claims.some(
      (claim) =>
        claim.target === "rootCause.assessment" &&
        claim.classification === "source_supported" &&
        claim.evidenceIds.length,
    )
  ) {
    errors.push(
      "High root-cause confidence requires a source-supported assessment.",
    );
  }
  if (
    result.evidenceSufficiency === "further evidence required" &&
    !result.researchGaps.length
  ) {
    errors.push("Identify the additional evidence needed before continuing.");
  }
  if (!isDeepStrictEqual(result.workflowContract, contract))
    errors.push("Preserve the reviewed workflowContract exactly.");
  const docs = new Map(
    evidence
      .filter((item) => item.sourceType === "documentation")
      .map((item) => [item.id, item]),
  );
  for (const reference of result.relatedDocumentation) {
    if (
      docs.get(reference.evidenceId)?.locator !== reference.source ||
      !docs.get(reference.evidenceId)?.linkable
    ) {
      errors.push(`Invalid documentation reference: ${reference.evidenceId}`);
    }
  }
  return errors;
}

export async function validateOrRepairTicketAnalysis(input: {
  output: unknown;
  evidence: EvidenceItem[];
  contract: TicketContract;
  repair: (errors: string[]) => Promise<unknown>;
}): Promise<z.infer<typeof synthesisSchema>> {
  let parsed = synthesisSchema.safeParse(input.output);
  const schemaIssues = (error: z.ZodError) =>
    error.issues.map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "root";
      return `Schema issue at ${path}: ${issue.code}`;
    });
  const errors = parsed.success
    ? analysisCitationErrors(parsed.data, input.evidence, input.contract)
    : schemaIssues(parsed.error);
  if (errors.length) {
    try {
      parsed = synthesisSchema.safeParse(await input.repair(errors));
    } catch {
      throw new EvidenceValidationError(
        "The technical analysis repair could not be completed.",
      );
    }
  }
  const finalErrors = parsed.success
    ? analysisCitationErrors(parsed.data, input.evidence, input.contract)
    : schemaIssues(parsed.error);
  if (finalErrors.length) {
    const details = finalErrors.slice(0, 8).join("; ");
    const remaining = finalErrors.length - 8;
    throw new EvidenceValidationError(
      `The technical analysis could not be validated against its captured sources. ${details}${remaining > 0 ? `; and ${remaining} more issue(s)` : ""}`,
    );
  }
  if (!parsed.success) {
    throw new EvidenceValidationError(
      "The technical analysis could not be validated against its captured sources.",
    );
  }
  return parsed.data;
}

export async function runTicketTechnicalAnalysisAgent(input: {
  jira: EvidenceBackedJiraTicket;
  slack: SlackTicketContext;
  contract: TicketContract;
}): Promise<TicketTechnicalAnalysis> {
  const session = createDocumentationResearchSession([
    ...input.jira.evidence,
    ...input.slack.evidence,
  ]);
  await session.documentTool.invoke({
    query: [input.jira.problemSummary, ...input.jira.keywords]
      .join(" ")
      .slice(0, 2000),
    reason:
      "Initial focused search based on the ticket problem and technical keywords",
  });
  const agent = createDeepAgent({
    name: "ticket-technical-analysis",
    model: createDeterministicGPT6LunaModel(),
    tools: [session.documentTool],
    systemPrompt: TICKET_TECHNICAL_ANALYSIS_PROMPT,
    responseFormat: toolStrategy(synthesisSchema),
  });
  const result = await agent.invoke(
    {
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            jira: {
              ...input.jira,
              originalJiraOutput: undefined,
              evidence: undefined,
            },
            slack: {
              ...input.slack,
              originalSlackOutput: undefined,
              evidence: undefined,
            },
            evidence: session.getEvidence(),
            searches: session.searches,
            workflowContract: input.contract,
            requirements: {
              documentationSearches: { minimum: 1, maximum: 3 },
              rootCauseMustHaveConfidenceAndEvidence: true,
              includeCodeAgentPrompt: true,
            },
          }),
        },
      ],
    },
    { recursionLimit: 30 },
  );

  if (!session.searches.length) {
    session.searches.push(
      makeSearchAttempt({
        source: "documentation",
        query: "",
        attempt: 1,
        startedAt: new Date().toISOString(),
        outcome: "skipped",
        reason: "The agent did not complete a documentation search.",
      }),
    );
  }
  const validated = await validateOrRepairTicketAnalysis({
    output: result.structuredResponse,
    evidence: session.getEvidence(),
    contract: input.contract,
    repair: async (errors) => {
      const repair = createAgent({
        tools: [],
        model: createDeterministicGPT6LunaModel(),
        systemPrompt: TICKET_ANALYSIS_REPAIR_PROMPT,
        responseFormat: toolStrategy(synthesisSchema),
      });
      const repaired = await repair.invoke(
        {
          messages: [
            {
              role: "user",
              content: JSON.stringify({
                previousAnalysis: result.structuredResponse,
                errors,
                workflowContract: input.contract,
                evidence: session.getEvidence(),
                searches: session.searches,
              }),
            },
          ],
        },
        { recursionLimit: 4 },
      );
      return repaired.structuredResponse;
    },
  });
  const retainedEvidence = session.getEvidence();
  const retainedIds = new Set(retainedEvidence.map((item) => item.id));
  const searches = [...input.slack.searches, ...session.searches].map(
    (search) => {
      const evidenceIds = search.evidenceIds.filter((id) =>
        retainedIds.has(id),
      );
      return evidenceIds.length === search.evidenceIds.length
        ? search
        : {
            ...search,
            evidenceIds,
            outcome: "partial" as const,
            truncated: true,
          };
    },
  );
  const limitations = searches
    .filter((search) => search.outcome !== "success")
    .map(
      (search) =>
        `${search.source}: ${search.outcome}${search.errorCode ? ` (${search.errorCode})` : ""}${search.truncated ? "; results truncated" : ""}.`,
    );
  if (input.slack.limitation) limitations.push(input.slack.limitation);
  if (
    [...input.jira.evidence, ...input.slack.evidence].some(
      (item) => !retainedIds.has(item.id),
    )
  ) {
    limitations.push(
      "Some carried evidence was omitted to meet the analysis context budget.",
    );
  }
  const researchGaps = [...validated.researchGaps];
  if (limitations.length)
    researchGaps.push({
      missingEvidence:
        "Research sources with non-success outcomes require review.",
      impact:
        "The available evidence may not establish a definitive cause or a safe implementation.",
      nextAction:
        "Review search outcomes, restore unavailable source access, and obtain complete relevant context.",
    });
  const inferred = validated.claims.filter(
    (claim) => claim.classification !== "source_supported",
  );
  const handoff = [
    validated.codeAgentPrompt,
    "\n## Captured Research Limitations",
    ...(limitations.length
      ? limitations
      : [
          "No acquisition limitations recorded; source meaning and freshness still require verification.",
        ]),
    "\n## Inferences and Unverified Claims",
    ...inferred.map(
      (claim) =>
        `${claim.target}: ${claim.classification} - ${claim.explanation}`,
    ),
    "\n## Source Registry",
    ...retainedEvidence.map(
      (item) =>
        `${item.id}: ${item.locator}${item.url ? ` (${item.url})` : ""}`,
    ),
    "\nDo not treat a citation as proof of causation. Validate assumptions against the implementation. Do not commit, push or deploy without explicit authorization.",
  ].join("\n");
  return ticketTechnicalAnalysisSchema.parse({
    ...validated,
    workflowContract: input.contract,
    researchGaps,
    evidenceSufficiency: limitations.length
      ? "further evidence required"
      : validated.evidenceSufficiency,
    codeAgentPrompt: handoff,
    evidence: retainedEvidence,
    searches,
    limitations,
  });
}
