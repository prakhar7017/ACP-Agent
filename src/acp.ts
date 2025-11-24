import WebSocket from "ws";
import type { ACPMessage } from "./types";

type MessageHandler = (msg: ACPMessage) => void;
type RawHandler = (raw: string) => void;
type ErrorHandler = (err: Error) => void;
type CloseHandler = (code?: number, reason?: string) => void;

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

  constructor(url?: string, apiKey?: string) {
    this.url = url ?? process.env.ACP_WS_URL ?? "ws://127.0.0.1:9000";
    this.apiKey = apiKey ?? process.env.CLAUDE_API_KEY ?? undefined;
  }

  private _handleMessage = (data: WebSocket.Data) => {
    const raw = data.toString();
    console.log("[ACP Client] Raw message received:", raw);
    this.onRawHandlers.forEach((h) => h(raw));
    try {
      const parsed = JSON.parse(raw) as ACPMessage;
      console.log("[ACP Client] Parsed message:", parsed);
      console.log("[ACP Client] Calling", this.onMessageHandlers.length, "message handlers");
      this.onMessageHandlers.forEach((h) => h(parsed));
    } catch (e) {
      console.error("[ACP Client] Failed to parse message:", e);
      // non-JSON or parse error — ignore or notify raw handlers
    }
  };

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
        console.log("[ACP Client] WebSocket opened, readyState:", this.ws?.readyState);
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
      console.log("[ACP Client] WebSocket event listeners registered");

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
    console.log("[ACP Client] Registering message handler, total handlers:", this.onMessageHandlers.length + 1);
    this.onMessageHandlers.push(h);
  }
  onRaw(h: RawHandler) { this.onRawHandlers.push(h); }
  onError(h: ErrorHandler) { this.onErrorHandlers.push(h); }
  onClose(h: CloseHandler) { this.onCloseHandlers.push(h); }

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
