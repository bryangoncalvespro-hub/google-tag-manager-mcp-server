import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerListVariables(server: McpServer): void {
  server.registerTool(
    "gtm_list_variables",
    {
      title: "List variables in a GTM workspace",
      description:
        "List every user-defined variable in the workspace.\n\n" +
        "Common types: `c` (Constant), `v` (DataLayer Variable), `u` (URL), `k` (First-Party Cookie), `jsm` (Custom JavaScript), `smm` (Lookup Table).\n\n" +
        "Returns: { variables: [{ variable_id, name, type, parameter }] }",
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
      const data = await api.listVariables(account_id, container_id, workspace_id);
      const variables = (data.variable ?? []).map((v: any) => ({
        variable_id: v.variableId,
        name: v.name,
        type: v.type,
        parameter: v.parameter,
        notes: v.notes,
      }));
      return buildToolResponse({ variables, count: variables.length });
    }
  );
}
