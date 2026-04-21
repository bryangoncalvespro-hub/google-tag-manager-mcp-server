import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse } from "../services/gtm-api.js";

export function registerCreateTrigger(server: McpServer): void {
  server.registerTool(
    "gtm_create_trigger",
    {
      title: "Create a trigger in a GTM workspace",
      description:
        "Create a trigger that can fire tags.\n\n" +
        "Common `type` values:\n" +
        "- `pageview` — Page View (DOM start)\n" +
        "- `domReady` — DOM Ready\n" +
        "- `windowLoaded` — Window Loaded\n" +
        "- `click`, `linkClick`, `formSubmission`\n" +
        "- `customEvent` — for dataLayer events (use custom_event_filter to match event name)\n\n" +
        "For customEvent, pass custom_event_filter like:\n" +
        "  [{parameter:[{type:'template',key:'arg0',value:'{{_event}}'},{type:'template',key:'arg1',value:'purchase'}],type:'equals'}]\n\n" +
        "Returns the created trigger including trigger_id.",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
        workspace_id: z.string(),
        name: z.string(),
        type: z.string().describe("Trigger type (e.g. 'pageview', 'customEvent')"),
        custom_event_filter: z.array(z.record(z.any())).optional(),
        filter: z.array(z.record(z.any())).optional(),
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
    async ({
      account_id,
      container_id,
      workspace_id,
      name,
      type,
      custom_event_filter,
      filter,
      parameter,
      notes,
    }) => {
      const trigger = await api.createTrigger(account_id, container_id, workspace_id, {
        name,
        type,
        customEventFilter: custom_event_filter,
        filter,
        parameter: parameter as any,
        notes,
      });
      return buildToolResponse({ trigger });
    }
  );
}
