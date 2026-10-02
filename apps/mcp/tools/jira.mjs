import * as z from "zod/v4";

const JIRA_FIELDS = [
  "summary",
  "description",
  "comment",
  "status",
  "priority",
  "labels",
  "components",
  "attachment",
  "created",
  "updated",
];

function removeAvatarUrls(value) {
  if (Array.isArray(value)) {
    return value.map(removeAvatarUrls);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "avatarUrls")
        .map(([key, nestedValue]) => [key, removeAvatarUrls(nestedValue)]),
    );
  }

  return value;
}

export function registerJiraTools(server) {
  server.registerTool(
    "get_jira_ticket",
    {
      title: "Get Jira Ticket",
      description:
        "Fetch selected fields from a Jira issue using bearer-token authorization.",
      inputSchema: {
        issueKey: z
          .string()
          .regex(/^[A-Z][A-Z0-9]+-\d+$/)
          .describe("Jira issue key, for example GROUP-123445"),
      },
    },
    async ({ issueKey }) => {
      const jiraBaseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, "");
      const bearerToken = process.env.JIRA_BEARER_TOKEN;

      if (!jiraBaseUrl) {
        throw new Error("JIRA_BASE_URL is not configured");
      }
      if (!bearerToken) {
        throw new Error("JIRA_BEARER_TOKEN is not configured");
      }

      const issueUrl = new URL(
        `/rest/api/2/issue/${encodeURIComponent(issueKey)}`,
        `${jiraBaseUrl}/`,
      );
      issueUrl.searchParams.set("fields", JIRA_FIELDS.join(","));

      const response = await fetch(issueUrl, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      if (!response.ok) {
        const responseText = await response.text();
        let detail = responseText;
        try {
          const errorBody = JSON.parse(responseText);
          detail = errorBody.errorMessages?.join(" ") || responseText;
        } catch {
          // Keep the plain response text when Jira does not return JSON.
        }
        throw new Error(
          `Jira request failed (${response.status}): ${detail || response.statusText}`,
        );
      }

      const issue = await response.json();
      const result = removeAvatarUrls({
        "ticketNo.": issueKey,
        fields: Object.fromEntries(
          JIRA_FIELDS.map((field) => [field, issue.fields?.[field] ?? null]),
        ),
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result,
      };
    },
  );
}
