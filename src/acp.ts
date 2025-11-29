import WebSocket from "ws";
import type { ACPMessage } from "./types";
import { log } from "./utils/logger";

export type { StreamChunkHandler };

type MessageHandler = (msg: ACPMessage) => void;
type RawHandler = (raw: string) => void;
type ErrorHandler = (err: Error) => void;
type CloseHandler = (code?: number, reason?: string) => void;
type StreamChunkHandler = (chunk: string, done: boolean, streamId: string) => void;

export type { ACPMessage };

export class ACPClient {
  private ws: WebSocket | null = null;
  private url: string;
  private apiKey?: string;
  private sendQueue: ACPMessage[] = [];

  private onMessageHandlers: MessageHandler[] = [];
  private onRawHandlers: RawHandler[] = [];
  private onErrorHandlers: ErrorHandler[] = [];
  private onCloseHandlers: CloseHandler[] = [];
  private onStreamChunkHandlers: StreamChunkHandler[] = [];

  constructor(url?: string, apiKey?: string) {
    this.url = url ?? process.env.ACP_WS_URL ?? "ws://127.0.0.1:9000";
    this.apiKey = apiKey ?? process.env.CLAUDE_API_KEY ?? undefined;
  }

  private _handleMessage = (data: WebSocket.Data) => {
    const raw = data.toString();
    this.onRawHandlers.forEach((h) => h(raw));
    
    try {
      const parsed = JSON.parse(raw) as ACPMessage;
      
      // Check if this is a streaming message
      if (parsed.type === "text_chunk" || parsed.type === "text_delta" || parsed.type === "stream") {
        this._handleStreamMessage(parsed);
        return;
      }
      
      // Handle regular complete messages
      this.onMessageHandlers.forEach((h) => h(parsed));
    } catch (e) {
      // Try to parse as streaming format (may be partial JSON or delimited)
      this._handlePotentialStreamChunk(raw);
    }
  };

  private _handleStreamMessage(msg: ACPMessage): void {
    const streamType = (msg as any).stream_type || "text";
    const chunk = (msg as any).delta || (msg as any).content || "";
    const done = (msg as any).done === true;
    const streamId = (msg as any).stream_id || `stream-${Date.now()}`;

    // Notify stream chunk handlers
    this.onStreamChunkHandlers.forEach((h) => h(chunk, done, streamId));
    
    // If stream is done, also notify as complete message
    if (done && chunk) {
      // Create a complete message from the stream
      const completeMsg: ACPMessage = {
        type: streamType === "tool_call" ? "tool_call" : "text",
        ...(streamType === "text" ? { content: chunk } : {}),
        ...msg,
      };
      this.onMessageHandlers.forEach((h) => h(completeMsg));
    }
  }

  private _handlePotentialStreamChunk(raw: string): void {
    // Handle SSE-style streaming (data: {...})
    if (raw.startsWith("data: ")) {
      try {
        const jsonStr = raw.slice(6); // Remove "data: " prefix
        const parsed = JSON.parse(jsonStr) as ACPMessage;
        this._handleStreamMessage(parsed);
        return;
      } catch (e) {
        // Not valid JSON, ignore
      }
    }
    
    // Handle NDJSON (newline-delimited JSON)
    if (raw.includes("\n")) {
      const lines = raw.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line) as ACPMessage;
            this._handleStreamMessage(parsed);
          } catch (e) {
            // Ignore invalid JSON lines
          }
        }
      }
      return;
    }
    
    // If we get here, it's not parseable - log error
    log.error("Failed to parse message:", raw);
  }

  private _handleClose = (code?: number, reason?: Buffer) => {
    const r = reason?.toString();
    this.onCloseHandlers.forEach((h) => h(code, r));
  };

  private _handleError = (err: Error) => {
    this.onErrorHandlers.forEach((h) => h(err));
  };

  connect(timeoutMs = 5000): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return Promise.resolve();

    return new Promise((resolve, reject) => {
      let settled = false;
      const headers = this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined;
      this.ws = new WebSocket(this.url, { headers } as any);

      const onOpen = () => {
        if (settled) return;
        settled = true;
        log.debugOnly("WebSocket opened, readyState:", this.ws?.readyState);
        // flush queue
        for (const m of this.sendQueue) this._sendRaw(JSON.stringify(m));
        this.sendQueue = [];
        resolve();
      };

      const onError = (err: Error) => {
        if (!settled) {
          settled = true;
          this.ws?.off("open", onOpen);
          this.ws?.off("error", onError);
          reject(err);
          return;
        }
        this._handleError(err);
      };

      // Set up persistent handlers that stay for the connection lifetime
      this.ws.on("open", onOpen);
      this.ws.on("error", onError);
      this.ws.on("message", this._handleMessage);
      this.ws.on("close", this._handleClose);
      log.debugOnly("WebSocket event listeners registered");

      // safety timeout
      const t = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.ws?.off("open", onOpen);
          this.ws?.off("error", onError);
          try { this.ws?.terminate(); } catch (_) {}
          reject(new Error("WebSocket connect timed out"));
        }
      }, timeoutMs);

      // ensure timeout cleared on settle
      const origResolve = resolve;
      resolve = (value?: any) => { clearTimeout(t); origResolve(value); };
      const origReject = reject;
      reject = (err: any) => { clearTimeout(t); origReject(err); };
    });
  }

  private _sendRaw(payload: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    this.ws.send(payload);
  }

  send(msg: ACPMessage): void {
    const payload = JSON.stringify(msg);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // queue until connected
      this.sendQueue.push(msg);
      return;
    }
    this._sendRaw(payload);
  }

  onMessage(h: MessageHandler) {
    this.onMessageHandlers.push(h);
  }
  onRaw(h: RawHandler) { this.onRawHandlers.push(h); }
  onError(h: ErrorHandler) { this.onErrorHandlers.push(h); }
  onClose(h: CloseHandler) { this.onCloseHandlers.push(h); }
  onStreamChunk(h: StreamChunkHandler) { this.onStreamChunkHandlers.push(h); }

  close() {
    if (this.ws) {
      this.ws.off("message", this._handleMessage);
      this.ws.off("close", this._handleClose);
      this.ws.off("error", this._handleError);
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
  }
}
