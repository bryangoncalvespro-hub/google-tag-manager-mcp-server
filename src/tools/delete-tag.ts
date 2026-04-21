import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerDeleteTag(server: McpServer): void {
  server.registerTool(
    "gtm_delete_tag",
    {
      title: "Delete a tag from a GTM workspace",
      description:
        "Permanently remove a tag. The change lives only in the workspace until a new version is published.\n\n" +
        "Returns: { deleted: true, tag_id }",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
        workspace_id: z.string(),
        tag_id: z.string(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ account_id, container_id, workspace_id, tag_id }) => {
      await api.deleteTag(account_id, container_id, workspace_id, tag_id);
      return buildToolResponse({ deleted: true, tag_id });
    }
  );
}
