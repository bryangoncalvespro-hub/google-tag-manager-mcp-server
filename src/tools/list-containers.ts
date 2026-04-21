import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerListContainers(server: McpServer): void {
  server.registerTool(
    "gtm_list_containers",
    {
      title: "List containers in a GTM account",
      description:
        "List every container (web / iOS / Android / AMP / server) inside a GTM account.\n\n" +
        "Returns: { containers: [{ container_id, name, public_id, usage_context, domain_name }] }",
      inputSchema: {
        account_id: z.string().describe("GTM account ID (from gtm_list_accounts)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ account_id }) => {
      const data = await api.listContainers(account_id);
      const containers = (data.container ?? []).map((c: any) => ({
        container_id: c.containerId,
        name: c.name,
        public_id: c.publicId,
        usage_context: c.usageContext,
        domain_name: c.domainName,
        notes: c.notes,
      }));
      return buildToolResponse({ containers, count: containers.length });
    }
  );
}
