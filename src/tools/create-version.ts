import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerCreateVersion(server: McpServer): void {
  server.registerTool(
    "gtm_create_version",
    {
      title: "Create a container version from a workspace",
      description:
        "Freeze the current workspace state into a container version, ready for publishing. " +
        "A new empty workspace is automatically created.\n\n" +
        "Returns: { version_id, name, notes, compiler_error }",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
        workspace_id: z.string(),
        name: z.string().optional().describe("Version name"),
        notes: z.string().optional().describe("Release notes"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ account_id, container_id, workspace_id, name, notes }) => {
      const result = await api.createVersion(account_id, container_id, workspace_id, {
        name,
        notes,
      });
      const v = (result.containerVersion ?? {}) as any;
      return buildToolResponse({
        version_id: v.containerVersionId,
        name: v.name,
        notes: v.notes,
        compiler_error: result.compilerError ?? false,
        sync_status: result.syncStatus,
      });
    }
  );
}
