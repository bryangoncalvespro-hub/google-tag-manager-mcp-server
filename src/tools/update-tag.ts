import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerUpdateTag(server: McpServer): void {
  server.registerTool(
    "gtm_update_tag",
    {
      title: "Update an existing tag",
      description:
        "Replace the full tag definition. All fields are overwritten, so always re-pass the complete config.\n\n" +
        "Returns the updated tag.",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
        workspace_id: z.string(),
        tag_id: z.string(),
        name: z.string(),
        type: z.string(),
        parameter: z.array(z.record(z.any())).optional(),
        firing_trigger_id: z.array(z.string()).optional(),
        blocking_trigger_id: z.array(z.string()).optional(),
        notes: z.string().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({
      account_id,
      container_id,
      workspace_id,
      tag_id,
      name,
      type,
      parameter,
      firing_trigger_id,
      blocking_trigger_id,
      notes,
    }) => {
      const tag = await api.updateTag(account_id, container_id, workspace_id, tag_id, {
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
