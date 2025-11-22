import { WebSocket } from "ws";

export interface ACPMessage {
    type: string;
    [key:string]: any;
}

type MessageHandler =(msg:ACPMessage) => void;
type ErrorHandler = (err: Error) => void;
type CloseHandler = () => void;

export class ACPClient {
    private ws: WebSocket | null = null ;
    private url: string;
    private apiKey?: string;

    private onMessageHandlers: MessageHandler[] = [];
    private onErrorHandlers: ErrorHandler[] = [];
    private onCloseHandlers: CloseHandler[] = [];

    constructor(url: string, apiKey?: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    connect() : Promise<void> {
        return new Promise((resolve,reject)=>{
            this.ws = new WebSocket(this.url, {
                headers: this.apiKey ? {Authorization: `Bearer ${this.apiKey}`} : undefined,
            })
            this.ws.on("open",()=>resolve());
            this.ws.on("message", (data: WebSocket.Data)=>{
                try {
                    const parsedData: ACPMessage = JSON.parse(data.toString()); 
                    this.onMessageHandlers.forEach((handler)=>handler(parsedData));
                } catch (error) {
                    console.error("Error parsing message:", error);
                }
            })
            this.ws.on("error",(error: Error)=>{
                this.onErrorHandlers.forEach((handler)=>handler(error));
                reject(error);
            })
            this.ws.on("close",()=>{
                this.onCloseHandlers.forEach((handler)=>handler());
                this.ws = null;
                reject(new Error("Connection closed"));
            })
        });
    }

    send(msg: ACPMessage): void {
        if(!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error("WebSocket not connected");
        this.ws.send(JSON.stringify(msg));
    }

    onMessage(handler:MessageHandler): void { this.onMessageHandlers.push(handler); }
    onError(handler:ErrorHandler): void { this.onErrorHandlers.push(handler); }
    onClose(handler:CloseHandler): void { this.onCloseHandlers.push(handler); }
    close(): void {
        if(this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}