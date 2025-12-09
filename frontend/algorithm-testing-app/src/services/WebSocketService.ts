type IncomingHandler = (data: any) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private onMessage: IncomingHandler | null = null;

  connect(url: string, onMessage?: IncomingHandler): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.socket = new WebSocket(url);
      } catch (err) {
        reject(err);
        return;
      }

      this.onMessage = onMessage || null;

      const onOpen = () => {
        this.socket?.removeEventListener("open", onOpen);
        this.socket?.removeEventListener("error", onError);
        resolve();
      };

      const onError = (ev: Event) => {
        this.socket?.removeEventListener("open", onOpen);
        this.socket?.removeEventListener("error", onError);
        reject(new Error("WebSocket connection error"));
      };

      this.socket.addEventListener("open", onOpen);

      this.socket.addEventListener("message", (ev) => {
        try {
          const json = JSON.parse(ev.data);
          this.onMessage && this.onMessage(json);
        } catch (e) {
          this.onMessage && this.onMessage(ev.data);
        }
      });

      this.socket.addEventListener("close", () => {
        this.socket = null;
      });

      this.socket.addEventListener("error", () => {
        // swallow; open rejects earlier
      });
    });
  }

  disconnect(): void {
    try {
      this.socket?.close();
    } catch {}
    this.socket = null;
  }

  isConnected(): boolean {
    return !!(this.socket && this.socket.readyState === WebSocket.OPEN);
  }

  sendRequest(request: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const message = {
      MessageType: "REQUEST",
      Request: request,
    };
    this.socket.send(JSON.stringify(message));
  }

  sendCommand(requestedState: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const message = {
      MessageType: "COMMAND",
      Command: { RequestedState: requestedState },
    };
    this.socket.send(JSON.stringify(message));
  }
}

export default WebSocketService;
