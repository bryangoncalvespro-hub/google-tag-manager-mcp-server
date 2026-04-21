import { getAccessToken } from "../auth.js";

const BASE_URL = "https://tagmanager.googleapis.com/tagmanager/v2";

export class GtmError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "GtmError";
    this.code = code;
    this.status = status;
  }

  toUserMessage(): string {
    let msg = `Google Tag Manager API Error (${this.code} / HTTP ${this.status}): ${this.message}`;
    if (this.status === 401) {
      msg += "\n→ Access token expired or invalid. Check GOOGLE_REFRESH_TOKEN.";
    }
    if (this.status === 403) {
      msg +=
        "\n→ Forbidden. The service account / user must have edit access on the container.";
    }
    if (this.status === 404) {
      msg += "\n→ Not found. Verify the account / container / workspace IDs.";
    }
    return msg;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function parseErr(res: Response): Promise<GtmError> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { error?: { message?: string; status?: string } };
    const e = json.error ?? {};
    return new GtmError(e.message ?? text, e.status ?? String(res.status), res.status);
  } catch {
    return new GtmError(text || "Unknown GTM API error", String(res.status), res.status);
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: await authHeaders() });
  if (!res.ok) throw await parseErr(res);
  return (await res.json()) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseErr(res);
  return (await res.json()) as T;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseErr(res);
  return (await res.json()) as T;
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw await parseErr(res);
}

// ── Paths ──

export const paths = {
  accounts: () => "/accounts",
  account: (a: string) => `/accounts/${a}`,
  containers: (a: string) => `/accounts/${a}/containers`,
  container: (a: string, c: string) => `/accounts/${a}/containers/${c}`,
  workspaces: (a: string, c: string) => `/accounts/${a}/containers/${c}/workspaces`,
  workspace: (a: string, c: string, w: string) =>
    `/accounts/${a}/containers/${c}/workspaces/${w}`,
  tags: (a: string, c: string, w: string) =>
    `/accounts/${a}/containers/${c}/workspaces/${w}/tags`,
  tag: (a: string, c: string, w: string, t: string) =>
    `/accounts/${a}/containers/${c}/workspaces/${w}/tags/${t}`,
  triggers: (a: string, c: string, w: string) =>
    `/accounts/${a}/containers/${c}/workspaces/${w}/triggers`,
  trigger: (a: string, c: string, w: string, t: string) =>
    `/accounts/${a}/containers/${c}/workspaces/${w}/triggers/${t}`,
  variables: (a: string, c: string, w: string) =>
    `/accounts/${a}/containers/${c}/workspaces/${w}/variables`,
  variable: (a: string, c: string, w: string, v: string) =>
    `/accounts/${a}/containers/${c}/workspaces/${w}/variables/${v}`,
  createVersion: (a: string, c: string, w: string) =>
    `/accounts/${a}/containers/${c}/workspaces/${w}:create_version`,
  quickPreview: (a: string, c: string, w: string) =>
    `/accounts/${a}/containers/${c}/workspaces/${w}:quick_preview`,
  publish: (a: string, c: string, v: string) =>
    `/accounts/${a}/containers/${c}/versions/${v}:publish`,
};

// ── Typed resource helpers ──

export type Parameter = {
  type: string;
  key: string;
  value?: string;
  list?: Parameter[];
  map?: Parameter[];
};

export type Tag = {
  tagId?: string;
  name: string;
  type: string;
  parameter?: Parameter[];
  firingTriggerId?: string[];
  blockingTriggerId?: string[];
  notes?: string;
  tagFiringOption?: string;
};

export type Trigger = {
  triggerId?: string;
  name: string;
  type: string;
  customEventFilter?: unknown[];
  filter?: unknown[];
  parameter?: Parameter[];
  notes?: string;
};

export type Variable = {
  variableId?: string;
  name: string;
  type: string;
  parameter?: Parameter[];
  notes?: string;
};

// ── Generic CRUD ──

export const api = {
  // Accounts
  listAccounts: () =>
    apiGet<{ account?: Array<Record<string, unknown>> }>(paths.accounts()),

  // Containers
  listContainers: (accountId: string) =>
    apiGet<{ container?: Array<Record<string, unknown>> }>(paths.containers(accountId)),
  getContainer: (accountId: string, containerId: string) =>
    apiGet<Record<string, unknown>>(paths.container(accountId, containerId)),

  // Workspaces
  listWorkspaces: (accountId: string, containerId: string) =>
    apiGet<{ workspace?: Array<Record<string, unknown>> }>(
      paths.workspaces(accountId, containerId)
    ),

  // Tags
  listTags: (accountId: string, containerId: string, workspaceId: string) =>
    apiGet<{ tag?: Array<Record<string, unknown>> }>(
      paths.tags(accountId, containerId, workspaceId)
    ),
  createTag: (accountId: string, containerId: string, workspaceId: string, tag: Tag) =>
    apiPost<Record<string, unknown>>(paths.tags(accountId, containerId, workspaceId), tag),
  updateTag: (
    accountId: string,
    containerId: string,
    workspaceId: string,
    tagId: string,
    tag: Tag
  ) => apiPut<Record<string, unknown>>(paths.tag(accountId, containerId, workspaceId, tagId), tag),
  deleteTag: (accountId: string, containerId: string, workspaceId: string, tagId: string) =>
    apiDelete(paths.tag(accountId, containerId, workspaceId, tagId)),

  // Triggers
  listTriggers: (accountId: string, containerId: string, workspaceId: string) =>
    apiGet<{ trigger?: Array<Record<string, unknown>> }>(
      paths.triggers(accountId, containerId, workspaceId)
    ),
  createTrigger: (
    accountId: string,
    containerId: string,
    workspaceId: string,
    trigger: Trigger
  ) =>
    apiPost<Record<string, unknown>>(
      paths.triggers(accountId, containerId, workspaceId),
      trigger
    ),

  // Variables
  listVariables: (accountId: string, containerId: string, workspaceId: string) =>
    apiGet<{ variable?: Array<Record<string, unknown>> }>(
      paths.variables(accountId, containerId, workspaceId)
    ),
  createVariable: (
    accountId: string,
    containerId: string,
    workspaceId: string,
    variable: Variable
  ) =>
    apiPost<Record<string, unknown>>(
      paths.variables(accountId, containerId, workspaceId),
      variable
    ),

  // Versions / publish / preview
  createVersion: (
    accountId: string,
    containerId: string,
    workspaceId: string,
    body: { name?: string; notes?: string }
  ) =>
    apiPost<{
      containerVersion?: Record<string, unknown>;
      compilerError?: boolean;
      syncStatus?: Record<string, unknown>;
    }>(paths.createVersion(accountId, containerId, workspaceId), body),
  publishVersion: (accountId: string, containerId: string, versionId: string) =>
    apiPost<Record<string, unknown>>(paths.publish(accountId, containerId, versionId), {}),
  quickPreview: (accountId: string, containerId: string, workspaceId: string) =>
    apiPost<Record<string, unknown>>(
      paths.quickPreview(accountId, containerId, workspaceId),
      {}
    ),
};

// ── Response helper ──

export const CHARACTER_LIMIT = 80_000;

export function buildToolResponse<T extends Record<string, unknown>>(output: T): {
  content: { type: "text"; text: string }[];
  structuredContent: T;
} {
  let text = JSON.stringify(output, null, 2);
  if (text.length > CHARACTER_LIMIT) {
    text =
      text.slice(0, CHARACTER_LIMIT) +
      `\n\n... [truncated: response exceeded ${CHARACTER_LIMIT} chars, reduce limit or add filters]`;
  }
  return {
    content: [{ type: "text", text }],
    structuredContent: output,
  };
}

// ── Parameter builders (make hand-crafting tags/triggers/variables easy) ──

export function templateParam(key: string, value: string): Parameter {
  return { type: "template", key, value };
}

export function booleanParam(key: string, value: boolean): Parameter {
  return { type: "boolean", key, value: String(value) };
}
