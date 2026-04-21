import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerPublishVersion(server: McpServer): void {
  server.registerTool(
    "gtm_publish_version",
    {
      title: "Publish a GTM container version",
      description:
        "Push a frozen container version live. This is the action that actually deploys tags " +
        "to users' browsers. Call after gtm_create_version.\n\n" +
        "Returns the published container version.",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
        version_id: z.string().describe("Container version ID to publish"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ account_id, container_id, version_id }) => {
      const result = await api.publishVersion(account_id, container_id, version_id);
      return buildToolResponse({ published: true, ...result });
    }
  );
}
