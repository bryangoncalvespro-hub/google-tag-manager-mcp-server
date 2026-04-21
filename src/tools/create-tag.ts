import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerCreateTag(server: McpServer): void {
  server.registerTool(
    "gtm_create_tag",
    {
      title: "Create a tag in a GTM workspace",
      description:
        "Create any tag (Google Ads conversion, GA4 event, Custom HTML, pixel…) in a workspace.\n\n" +
        "Common `type` values:\n" +
        "- `awct` — Google Ads Conversion Tracking\n" +
        "- `sp` — Google Ads Remarketing\n" +
        "- `gaawc` — GA4 Configuration\n" +
        "- `gaawe` — GA4 Event\n" +
        "- `html` — Custom HTML\n\n" +
        "`parameter` is an array of `{ type, key, value }`. Example for awct:\n" +
        "  [{type:'template',key:'conversionId',value:'AW-123'}, {type:'template',key:'conversionLabel',value:'abc'}]\n\n" +
        "Returns the created tag object including the new tag_id.",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
        workspace_id: z.string(),
        name: z.string().describe("Human-readable tag name"),
        type: z.string().describe("GTM tag type (e.g. 'awct', 'gaawe', 'html')"),
        parameter: z
          .array(z.record(z.any()))
          .optional()
          .describe("Array of { type, key, value } parameter objects"),
        firing_trigger_id: z
          .array(z.string())
          .optional()
          .describe("Trigger IDs that fire this tag"),
        blocking_trigger_id: z.array(z.string()).optional(),
        notes: z.string().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({
      account_id,
      container_id,
      workspace_id,
      name,
      type,
      parameter,
      firing_trigger_id,
      blocking_trigger_id,
      notes,
    }) => {
      const tag = await api.createTag(account_id, container_id, workspace_id, {
        name,
        type,
        parameter: parameter as any,
        firingTriggerId: firing_trigger_id,
        blockingTriggerId: blocking_trigger_id,
        notes,
      });
      return buildToolResponse({ tag });
    }
  );
}
