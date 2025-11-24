import WebSocket from "ws";

export interface ACPMessage {
  type: string;
  [key: string]: any;
}

type MessageHandler = (msg: ACPMessage) => void;
type RawHandler = (raw: string) => void;
type ErrorHandler = (err: Error) => void;
type CloseHandler = (code?: number, reason?: string) => void;

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
    this.apiKey = apiKey ?? process.env.CLAUDE_API_KEY;
  }

  connect(timeoutMs = 5000): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return Promise.resolve();

    return new Promise((resolve, reject) => {
      let settled = false;
      const headers = this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined;
      this.ws = new WebSocket(this.url, { headers } as any);

      const onOpen = () => {
        if (settled) return;
        settled = true;
        // flush queue
        for (const m of this.sendQueue) this._sendRaw(JSON.stringify(m));
        this.sendQueue = [];
        cleanup();
        resolve();
      };

      const onError = (err: Error) => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(err);
          return;
        }
        this.onErrorHandlers.forEach((h) => h(err));
      };

      const onMessage = (data: WebSocket.Data) => {
        const raw = data.toString();
        this.onRawHandlers.forEach((h) => h(raw));
        try {
          const parsed = JSON.parse(raw) as ACPMessage;
          this.onMessageHandlers.forEach((h) => h(parsed));
        } catch (e) {
          // non-JSON or parse error — ignore or notify raw handlers
        }
      };

      const onClose = (code?: number, reason?: Buffer) => {
        const r = reason?.toString();
        this.onCloseHandlers.forEach((h) => h(code, r));
        // do NOT reject connect if already resolved — connection lifecycle event
      };

      const cleanup = () => {
        this.ws?.off("open", onOpen);
        this.ws?.off("error", onError);
        this.ws?.off("message", onMessage);
        this.ws?.off("close", onClose);
      };

      this.ws.on("open", onOpen);
      this.ws.on("error", onError);
      this.ws.on("message", onMessage);
      this.ws.on("close", onClose);

      // safety timeout
      const t = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
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

  onMessage(h: MessageHandler) { this.onMessageHandlers.push(h); }
  onRaw(h: RawHandler) { this.onRawHandlers.push(h); }
  onError(h: ErrorHandler) { this.onErrorHandlers.push(h); }
  onClose(h: CloseHandler) { this.onCloseHandlers.push(h); }

  close() {
    try { this.ws?.close(); } finally { this.ws = null; }
  }
}
