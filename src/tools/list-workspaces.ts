import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerListWorkspaces(server: McpServer): void {
  server.registerTool(
    "gtm_list_workspaces",
    {
      title: "List workspaces inside a GTM container",
      description:
        "List workspaces of a container. The 'Default Workspace' (usually workspace_id=1) is the one you'll edit by default.\n\n" +
        "Returns: { workspaces: [{ workspace_id, name, description }] }",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ account_id, container_id }) => {
      const data = await api.listWorkspaces(account_id, container_id);
      const workspaces = (data.workspace ?? []).map((w: any) => ({
        workspace_id: w.workspaceId,
        name: w.name,
        description: w.description,
      }));
      return buildToolResponse({ workspaces, count: workspaces.length });
    }
  );
}
