import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api, buildToolResponse, templateParam } from "../services/gtm-api.js";

/**
 * High-level helper: install a Google Ads Conversion tracking end-to-end.
 *
 * Creates inside the given workspace:
 *   1. Constant variable "Google Ads Conversion ID" (AW-XXXXXXXXXX)
 *   2. Constant variable "Google Ads Conversion Label — {event_name}"
 *   3. Trigger — either All Pages (pageview) or dataLayer customEvent matching event_name
 *   4. Tag type `awct` (Google Ads Conversion Tracking) referencing both variables and trigger
 *   5. Optionally creates a version and publishes it.
 */
export function registerInstallGoogleAdsConversion(server: McpServer): void {
  server.registerTool(
    "gtm_install_google_ads_conversion",
    {
      title: "Install a Google Ads conversion in GTM (end-to-end)",
      description:
        "All-in-one helper that creates the variables, trigger, and awct tag required to track " +
        "a Google Ads conversion — optionally creating a version and publishing it in the same call.\n\n" +
        "Pick the trigger_type:\n" +
        "- `page_view` → fires on every page (good for landing-page conversions / lead signup pages)\n" +
        "- `custom_event` → fires when a dataLayer event matches `event_name` (good for purchase, signup, contact_submit…)\n\n" +
        "If conversion_value / currency are provided, they are passed as constant parameters on the tag.\n\n" +
        "Returns the created resources (variables, trigger, tag) and, if publish=true, the published version.",
      inputSchema: {
        account_id: z.string(),
        container_id: z.string(),
        workspace_id: z.string(),
        conversion_id: z
          .string()
          .describe("Full conversion ID, e.g. 'AW-123456789'"),
        conversion_label: z
          .string()
          .describe("Conversion label from Google Ads (the part after the slash)"),
        event_name: z
          .string()
          .describe(
            "Short event name used to name resources (e.g. 'purchase', 'lead', 'signup')"
          ),
        trigger_type: z
          .enum(["page_view", "custom_event"])
          .default("custom_event"),
        conversion_value: z
          .string()
          .optional()
          .describe(
            "Static conversion value, or a dataLayer reference like '{{DLV - purchase_value}}'"
          ),
        currency_code: z.string().optional().describe("e.g. 'EUR', 'USD'"),
        transaction_id: z
          .string()
          .optional()
          .describe("Optional transaction ID (or variable reference)"),
        publish: z
          .boolean()
          .default(false)
          .describe(
            "If true, also create a container version and publish it after creating the resources"
          ),
        version_name: z.string().optional(),
        version_notes: z.string().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      const {
        account_id,
        container_id,
        workspace_id,
        conversion_id,
        conversion_label,
        event_name,
        trigger_type,
        conversion_value,
        currency_code,
        transaction_id,
        publish,
        version_name,
        version_notes,
      } = input;

      const slug = event_name.trim().replace(/\s+/g, "_").toLowerCase();

      // 1. Variables
      const varId = await api.createVariable(account_id, container_id, workspace_id, {
        name: `CONST - Google Ads Conversion ID`,
        type: "c",
        parameter: [templateParam("value", conversion_id)],
        notes: "Created by gtm_install_google_ads_conversion",
      });

      const varLabel = await api.createVariable(account_id, container_id, workspace_id, {
        name: `CONST - Google Ads Conversion Label - ${slug}`,
        type: "c",
        parameter: [templateParam("value", conversion_label)],
        notes: `Conversion label for ${slug}`,
      });

      // 2. Trigger
      let trigger: Record<string, unknown>;
      if (trigger_type === "page_view") {
        trigger = await api.createTrigger(account_id, container_id, workspace_id, {
          name: `Trigger - All Pages - Google Ads ${slug}`,
          type: "pageview",
          notes: `Auto-installed conversion trigger (${slug})`,
        });
      } else {
        trigger = await api.createTrigger(account_id, container_id, workspace_id, {
          name: `Trigger - Custom Event - ${slug}`,
          type: "customEvent",
          customEventFilter: [
            {
              type: "equals",
              parameter: [
                templateParam("arg0", "{{_event}}"),
                templateParam("arg1", event_name),
              ],
            },
          ],
          notes: `Fires on dataLayer event '${event_name}'`,
        });
      }

      const triggerId = (trigger.triggerId ?? (trigger as any).triggerId) as string;

      // 3. Tag
      const tagParameters = [
        templateParam("conversionId", `{{${(varId as any).name}}}`),
        templateParam("conversionLabel", `{{${(varLabel as any).name}}}`),
      ];
      if (conversion_value) {
        tagParameters.push(templateParam("conversionValue", conversion_value));
      }
      if (currency_code) {
        tagParameters.push(templateParam("currencyCode", currency_code));
      }
      if (transaction_id) {
        tagParameters.push(templateParam("orderId", transaction_id));
      }

      const tag = await api.createTag(account_id, container_id, workspace_id, {
        name: `Google Ads Conversion - ${slug}`,
        type: "awct",
        parameter: tagParameters,
        firingTriggerId: [triggerId],
        notes: `Auto-installed by gtm_install_google_ads_conversion (${slug})`,
      });

      const out: Record<string, unknown> = {
        variables: { conversion_id: varId, conversion_label: varLabel },
        trigger,
        tag,
      };

      // 4. Optional version + publish
      if (publish) {
        const version = await api.createVersion(account_id, container_id, workspace_id, {
          name: version_name ?? `Install Google Ads conversion ${slug}`,
          notes:
            version_notes ??
            `Automated install of Google Ads conversion '${slug}' (${conversion_id}/${conversion_label}).`,
        });
        const versionId = (version.containerVersion as any)?.containerVersionId;
        out.version = version;

        if (versionId) {
          const published = await api.publishVersion(account_id, container_id, versionId);
          out.published = published;
        } else {
          out.publish_skipped = "No version id returned; check compiler_error above.";
        }
      }

      return buildToolResponse(out);
    }
  );
}
