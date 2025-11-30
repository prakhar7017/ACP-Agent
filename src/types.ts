export interface ACPMessage {
  type: string;
  [key: string]: unknown;
}

export interface ACPTextMessage extends ACPMessage {
  type: "text";
  content: string;
}

export interface ACPTextChunkMessage extends ACPMessage {
  type: "text_chunk" | "text_delta";
  content: string;
  delta?: string;
  done?: boolean;
}

export interface ACPStreamMessage extends ACPMessage {
  type: "stream";
  stream_type?: "text" | "tool_call";
  content?: string;
  delta?: string;
  done?: boolean;
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
  model?: string;
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
  metadata?: {
    model?: string;
    workspace?: string;
    createdAt?: number;
    lastUpdated?: number;
  };
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

