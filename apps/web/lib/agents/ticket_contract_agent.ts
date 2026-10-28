import { createDeepAgent } from "deepagents";
import { toolStrategy } from "langchain";
import { z } from "zod";
import { createDeterministicGPT6LunaModel } from "../llm/model.js";
import type { JiraTicketGetAgentResult } from "./get_jira_ticket_agent";
import { TICKET_CONTRACT_PROMPT } from "../skill/jira_analysis";
import {
  claimSchema,
  validateCitations,
  validateClaimText,
  EvidenceValidationError,
} from "../workflow/ticket_evidence";

type EvidenceBackedJiraTicket = JiraTicketGetAgentResult & {
  evidence: import("../workflow/ticket_evidence").EvidenceItem[];
};

const fieldProvenanceSchema = z.object({
  field: z.enum([
    "requestedOutcome",
    "expectedBehavior",
    "actualBehavior",
    "scope",
    "acceptanceCriteria",
    "constraints",
    "dependencies",
  ]),
  status: z.enum(["confirmed", "inferred", "missing"]),
  source: z.string(),
  note: z.string(),
  evidenceIds: z.array(z.string()),
});

export const ticketContractSchema = z.object({
  ticketKey: z.string().regex(/^(GROUP|PROD)-\d+$/),
  ticketType: z.enum([
    "implementation",
    "investigation",
    "design or decision",
    "blocked or insufficient information",
  ]),
  requestedOutcome: z.string(),
  expectedBehavior: z.string(),
  actualBehavior: z.string(),
  scope: z.array(z.string()),
  confirmedFacts: z.array(z.string()),
  openQuestions: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  constraintsAndDependencies: z.array(z.string()),
  fieldProvenance: z.array(fieldProvenanceSchema),
  readiness: z.enum(["ready for evidence gathering", "blocked"]),
  claims: z.array(claimSchema).max(100),
});

export type TicketContract = z.infer<typeof ticketContractSchema>;

const ticketContractAgent = createDeepAgent({
  name: "ticket-contract",
  model: createDeterministicGPT6LunaModel(),
  systemPrompt: TICKET_CONTRACT_PROMPT,
  responseFormat: toolStrategy(ticketContractSchema),
});

export async function runTicketContractAgent(
  jira: EvidenceBackedJiraTicket,
): Promise<TicketContract> {
  const result = await ticketContractAgent.invoke({
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          ticketKey: jira.ticketKey,
          jira: jira.originalJiraOutput,
          problemSummary: jira.problemSummary,
          evidence: jira.evidence,
        }),
      },
    ],
  });

  const parsed = ticketContractSchema.safeParse(result.structuredResponse);
  if (!parsed.success) {
    throw new Error(
      "The ticket contract agent returned invalid structured output.",
    );
  }

  if (ticketContractEvidenceErrors(parsed.data, jira).length)
    throw new EvidenceValidationError(
      "The ticket contract contains unsupported source references.",
    );
  return parsed.data;
}

export function ticketContractEvidenceErrors(
  contract: TicketContract,
  jira: EvidenceBackedJiraTicket,
): string[] {
  const targets = [
    "requestedOutcome",
    "expectedBehavior",
    "actualBehavior",
    ...[
      "scope",
      "confirmedFacts",
      "acceptanceCriteria",
      "constraintsAndDependencies",
    ].flatMap((field) =>
      (contract[field as "scope"] as string[]).map(
        (_, index) => `${field}[${index}]`,
      ),
    ),
  ];
  const errors = validateCitations(
    {
      claims: contract.claims,
      conflicts: [],
      researchGaps: [],
      evidenceSufficiency: "further evidence required",
    },
    jira.evidence,
    targets,
  );
  const knownIds = new Set(jira.evidence.map((item) => item.id));
  errors.push(...validateClaimText(contract.claims, contract));
  for (const [index] of contract.confirmedFacts.entries()) {
    if (
      !contract.claims.some(
        (claim) =>
          claim.target === `confirmedFacts[${index}]` &&
          claim.classification === "source_supported",
      )
    )
      errors.push("Confirmed facts require source-supported claims.");
  }
  if (contract.ticketKey !== jira.ticketKey)
    errors.push("Ticket key mismatch.");
  const expectedFields = [
    "requestedOutcome",
    "expectedBehavior",
    "actualBehavior",
    "scope",
    "acceptanceCriteria",
    "constraints",
    "dependencies",
  ];
  if (
    expectedFields.some(
      (field) =>
        contract.fieldProvenance.filter((item) => item.field === field)
          .length !== 1,
    )
  ) {
    errors.push(
      "Each understanding field requires exactly one provenance entry.",
    );
  }
  for (const field of contract.fieldProvenance) {
    if (
      field.evidenceIds.some((id) => !knownIds.has(id)) ||
      (field.status === "confirmed" && !field.evidenceIds.length)
    ) {
      errors.push(`Invalid provenance: ${field.field}`);
    }
  }
  return errors;
}
