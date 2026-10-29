import { createDeepAgent } from "deepagents";
import { tool, toolStrategy } from "langchain";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { createDeterministicGPT6LunaModel } from "../llm/model.js";
import { ANALYSIS_JIRA_CONTENT_PROMPT } from "../skill/jira_analysis";
import { backend, documentSearch } from "../tools/rag_search";
import { searchSlackMessages } from "../tools/slack_search_messages";
import type { JiraTicketDetails } from "./get_jira_ticket_agent";

const fixPlanStepSchema = z.object({
  title: z.string().min(1),
  details: z.string().min(1),
  validation: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([]),
});

export const jiraTicketAnalysisOutputSchema = z.object({
  problemSummary: z.string().min(1),
  keywords: z.array(z.string().trim().min(1).max(100)).max(8).default([]),
  projectName: z.string().nullable().optional(),
  fixPlan: z
    .object({
      summary: z
        .string()
        .min(1)
        .default("Plan based on available ticket information."),
      steps: z.array(fixPlanStepSchema).max(10).default([]),
    })
    .default({
      summary: "Plan based on available ticket information.",
      steps: [],
    }),
});

export type JiraTicketAnalysisResult = z.infer<
  typeof jiraTicketAnalysisOutputSchema
> &
  JiraTicketDetails;

type SlackSearchStage = "problem_understanding" | "solution_plan";

export class JiraTicketAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JiraTicketAnalysisError";
  }
}

function loadRepositoryNames(): string[] {
  const repositories = JSON.parse(
    readFileSync(new URL("../../config/repos.json", import.meta.url), "utf8"),
  ) as unknown;
  if (
    !Array.isArray(repositories) ||
    !repositories.every((repository) => typeof repository === "string")
  ) {
    throw new Error("The configured repository list is invalid.");
  }
  return repositories;
}

function createStageSlackSearchTool() {
  const completedStages = new Set<SlackSearchStage>();
  return tool(
    async ({ stage, searchTerms }) => {
      if (
        stage === "solution_plan" &&
        !completedStages.has("problem_understanding")
      ) {
        return JSON.stringify({
          status: "skipped",
          reason: "Search problem_understanding before solution_plan.",
        });
      }
      if (completedStages.has(stage)) {
        return JSON.stringify({
          status: "skipped",
          reason: `Slack search already used for ${stage}.`,
        });
      }
      completedStages.add(stage);
      try {
        return await searchSlackMessages.invoke({ keywords: searchTerms });
      } catch {
        return JSON.stringify({
          status: "failed",
          reason: `Slack search was unavailable for ${stage}. Keep uncertainty visible.`,
        });
      }
    },
    {
      name: "search_slack_messages",
      description:
        "Search Slack once for problem_understanding, then once for solution_plan. Compose fresh focused searchTerms for each stage; do not forward existing Jira keywords.",
      schema: z.object({
        stage: z.enum(["problem_understanding", "solution_plan"]),
        searchTerms: z.array(z.string().trim().min(1).max(200)).min(1).max(5),
      }),
    },
  );
}

export async function runAnalyzeJiraTicketAgent(
  jira: JiraTicketDetails,
): Promise<JiraTicketAnalysisResult> {
  const repositories = loadRepositoryNames();
  const jiraTicketAgent = createDeepAgent({
    name: "analyze_jira_ticket",
    model: createDeterministicGPT6LunaModel(),
    tools: [documentSearch, createStageSlackSearchTool()],
    backend,
    systemPrompt: ANALYSIS_JIRA_CONTENT_PROMPT,
    responseFormat: toolStrategy(jiraTicketAnalysisOutputSchema),
  });
  let result;
  try {
    result = await jiraTicketAgent.invoke(
      {
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              ticketKey: jira.ticketKey,
              ticket: jira.originalJiraOutput,
              allowedProjectNames: repositories,
            }),
          },
        ],
      },
      { recursionLimit: 20 },
    );
  } catch {
    throw new JiraTicketAnalysisError(
      "Jira was retrieved, but analysis or research failed. Check chat-model, RAG/Pinecone, and Slack access, then try again.",
    );
  }

  const parsed = jiraTicketAnalysisOutputSchema.safeParse(
    result.structuredResponse,
  );
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 6)
      .map((issue) => `${issue.path.join(".") || "result"}: ${issue.code}`)
      .join("; ");
    throw new JiraTicketAnalysisError(
      `The Jira analysis returned incomplete structured output. ${issues}`,
    );
  }

  const fixPlan = parsed.data.fixPlan.steps.length
    ? parsed.data.fixPlan
    : {
        summary:
          "Confirm the reported behavior and affected component before choosing an implementation change.",
        steps: [
          {
            title: "Confirm and reproduce the reported issue",
            details:
              "Use the Jira description and expected/actual behavior to establish a reproducible case.",
            validation: [
              "Verify the reported failure and record the conditions required to reproduce it.",
            ],
            openQuestions: [
              "Which environment, inputs, and steps reproduce the issue?",
            ],
          },
          {
            title:
              "Identify the cause, then implement and verify a focused fix",
            details:
              "Confirm the responsible component before selecting the smallest change that addresses the Jira behavior.",
            validation: [
              "Add or run a regression check for the reported behavior.",
              "Verify the ticket's expected behavior after the proposed change.",
            ],
            openQuestions: [],
          },
        ],
      };
  const projectName = parsed.data.projectName ?? "";

  return {
    ...parsed.data,
    fixPlan,
    ticketKey: jira.ticketKey,
    projectName: repositories.includes(projectName) ? projectName : "",
    originalJiraOutput: jira.originalJiraOutput,
  };
}
