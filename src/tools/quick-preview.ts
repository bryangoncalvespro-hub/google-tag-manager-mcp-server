import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerQuickPreview(server: McpServer): void {
  server.registerTool(
    "gtm_quick_preview",
    {
      title: "Create a quick preview version (no publish)",
      description:
        "Compile the workspace into a throwaway version so you can check compiler errors and " +
        "sync status without actually creating a permanent version. Useful as a smoke test " +
        "before gtm_create_version.\n\n" +
        "Returns: { compiler_error, sync_status, container_version }",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
        workspace_id: z.string(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ account_id, container_id, workspace_id }) => {
      const result = await api.quickPreview(account_id, container_id, workspace_id);
      return buildToolResponse({ ...result });
    }
  );
}
