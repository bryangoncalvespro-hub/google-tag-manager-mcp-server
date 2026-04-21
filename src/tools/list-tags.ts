import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerListTags(server: McpServer): void {
  server.registerTool(
    "gtm_list_tags",
    {
      title: "List tags in a GTM workspace",
      description:
        "List every tag configured in the given workspace.\n\n" +
        "Common types: `awct` (Google Ads Conversion), `sp` (Google Ads Remarketing), `ga4` (GA4 Event), `gaawc` (GA4 Config), `html` (Custom HTML).\n\n" +
        "Returns: { tags: [{ tag_id, name, type, firing_trigger_id, parameter, paused }] }",
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
      const data = await api.listTags(account_id, container_id, workspace_id);
      const tags = (data.tag ?? []).map((t: any) => ({
        tag_id: t.tagId,
        name: t.name,
        type: t.type,
        firing_trigger_id: t.firingTriggerId,
        parameter: t.parameter,
        paused: t.paused,
        notes: t.notes,
      }));
      return buildToolResponse({ tags, count: tags.length });
    }
  );
}
