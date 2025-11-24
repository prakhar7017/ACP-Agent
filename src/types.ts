// src/types.ts
export interface ACPMessage {
  type: string;
  [key: string]: unknown;
}

export interface ACPTextMessage extends ACPMessage {
  type: "text";
  content: string;
}

export interface ACPToolCallMessage extends ACPMessage {
  type: "tool_call";
  id: string;
  tool: string;
  args: Record<string, unknown>;
}

export interface ACPClientMessage extends ACPMessage {
  type: "client_message";
  role: "user" | "assistant";
  content: string;
}

export interface ACPToolResultMessage extends ACPMessage {
  type: "tool_result";
  tool_call_id: string;
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  code?: number | null;
}

export type ACPMessageUnion =
  | ACPTextMessage
  | ACPToolCallMessage
  | ACPClientMessage
  | ACPToolResultMessage;

export interface SessionEntry {
  incoming?: ACPMessage;
  outgoing?: ACPMessage;
  ts: number;
}

export interface SessionData {
  messages: SessionEntry[];
}

export interface WriteFileArgs {
  path: string;
  content: string;
  mode?: "create" | "edit" | "patch";
}

export interface ReadFileArgs {
  path: string;
}

export interface RunShellArgs {
  cmd: string;
  cwd?: string;
}

export interface ToolResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  code?: number | null;
  message?: string;
}

