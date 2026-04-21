import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerListAccounts(server: McpServer): void {
  server.registerTool(
    "gtm_list_accounts",
    {
      title: "List accessible GTM accounts",
      description:
        "List every Google Tag Manager account the authenticated user has access to. " +
        "Use this first to discover the account_id values required by other tools.\n\n" +
        "Returns: { accounts: [{ account_id, name, path, fingerprint }] }",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      const data = await api.listAccounts();
      const accounts = (data.account ?? []).map((a: any) => ({
        account_id: a.accountId,
        name: a.name,
        path: a.path,
        fingerprint: a.fingerprint,
      }));
      return buildToolResponse({ accounts, count: accounts.length });
    }
  );
}
