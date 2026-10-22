export const JIRA_FIELDS = [
  "summary",
  "project",
  "issuetype",
  "description",
  "comment",
  "status",
  "priority",
  "labels",
  "components",
  "issuelinks",
  "attachment",
  "created",
  "updated",
];

export function removeAvatarUrls(value) {
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
