import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";

import { registerListAccounts } from "./tools/list-accounts.js";
import { registerListContainers } from "./tools/list-containers.js";
import { registerListWorkspaces } from "./tools/list-workspaces.js";
import { registerListTags } from "./tools/list-tags.js";
import { registerListTriggers } from "./tools/list-triggers.js";
import { registerListVariables } from "./tools/list-variables.js";
import { registerCreateTag } from "./tools/create-tag.js";
import { registerCreateTrigger } from "./tools/create-trigger.js";
import { registerCreateVariable } from "./tools/create-variable.js";
import { registerUpdateTag } from "./tools/update-tag.js";
import { registerDeleteTag } from "./tools/delete-tag.js";
import { registerCreateVersion } from "./tools/create-version.js";
import { registerPublishVersion } from "./tools/publish-version.js";
import { registerQuickPreview } from "./tools/quick-preview.js";
import { registerInstallGoogleAdsConversion } from "./tools/install-google-ads-conversion.js";

const TOOL_COUNT = 15;

function createServer(): McpServer {
  const server = new McpServer({
    name: "google-tag-manager-mcp-server",
    version: "1.0.0",
  });

  registerListAccounts(server);
  registerListContainers(server);
  registerListWorkspaces(server);
  registerListTags(server);
  registerListTriggers(server);
  registerListVariables(server);
  registerCreateTag(server);
  registerCreateTrigger(server);
  registerCreateVariable(server);
  registerUpdateTag(server);
  registerDeleteTag(server);
  registerCreateVersion(server);
  registerPublishVersion(server);
  registerQuickPreview(server);
  registerInstallGoogleAdsConversion(server);

  return server;
}

async function runHttp(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "4mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      server: "google-tag-manager-mcp-server",
      tools: TOOL_COUNT,
    });
  });

  app.post("/mcp", async (req, res) => {
    try {
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("Error handling MCP request:", err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  const port = parseInt(process.env.PORT || "3000", 10);
  app.listen(port, () => {
    console.error(
      `google-tag-manager-mcp-server listening on http://0.0.0.0:${port}/mcp`
    );
  });
}

async function runStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("google-tag-manager-mcp-server running on stdio");
}

const transport = process.env.TRANSPORT || "stdio";
if (transport === "http") {
  runHttp().catch((err) => {
    console.error("Server error:", err);
    process.exit(1);
  });
} else {
  runStdio().catch((err) => {
    console.error("Server error:", err);
    process.exit(1);
  });
}
