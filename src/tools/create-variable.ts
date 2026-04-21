import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerCreateVariable(server: McpServer): void {
  server.registerTool(
    "gtm_create_variable",
    {
      title: "Create a variable in a GTM workspace",
      description:
        "Create a user-defined variable in the workspace.\n\n" +
        "Common `type` values:\n" +
        "- `c` — Constant (parameter: [{type:'template',key:'value',value:'...'}])\n" +
        "- `v` — DataLayer Variable (parameter: [{type:'template',key:'name',value:'my_dl_key'},{type:'integer',key:'dataLayerVersion',value:'2'}])\n" +
        "- `u` — URL\n" +
        "- `k` — First-Party Cookie\n" +
        "- `jsm` — Custom JavaScript (parameter: [{type:'template',key:'javascript',value:'function(){ return ... }'}])\n" +
        "- `smm` — Lookup Table\n\n" +
        "Returns the created variable including variable_id.",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
        workspace_id: z.string(),
        name: z.string(),
        type: z.string(),
        parameter: z.array(z.record(z.any())).optional(),
        notes: z.string().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ account_id, container_id, workspace_id, name, type, parameter, notes }) => {
      const variable = await api.createVariable(account_id, container_id, workspace_id, {
        name,
        type,
        parameter: parameter as any,
        notes,
      });
      return buildToolResponse({ variable });
    }
  );
}
