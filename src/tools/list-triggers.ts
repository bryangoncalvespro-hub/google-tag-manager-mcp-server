import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerListTriggers(server: McpServer): void {
  server.registerTool(
    "gtm_list_triggers",
    {
      title: "List triggers in a GTM workspace",
      description:
        "List every trigger in the workspace.\n\n" +
        "Common types: `pageview`, `domReady`, `windowLoaded`, `click`, `linkClick`, `formSubmission`, `customEvent`.\n\n" +
        "Returns: { triggers: [{ trigger_id, name, type, custom_event_filter, filter }] }",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
        workspace_id: z.string(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ account_id, container_id, workspace_id }) => {
      const data = await api.listTriggers(account_id, container_id, workspace_id);
      const triggers = (data.trigger ?? []).map((t: any) => ({
        trigger_id: t.triggerId,
        name: t.name,
        type: t.type,
        custom_event_filter: t.customEventFilter,
        filter: t.filter,
        notes: t.notes,
      }));
      return buildToolResponse({ triggers, count: triggers.length });
    }
  );
}
