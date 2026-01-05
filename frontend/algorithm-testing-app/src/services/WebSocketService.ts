type IncomingHandler = (data: any) => void;

export class WebSocketService {
  private static instance: WebSocketService;

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private socket: WebSocket | null = null;
  private onMessage: IncomingHandler | null = null;
  private connectionPromise: Promise<void> | null = null;

  connect(url: string, onMessage?: IncomingHandler): Promise<void> {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      if (onMessage) this.onMessage = onMessage;
      return this.connectionPromise || Promise.resolve();
    }

    this.onMessage = onMessage || null;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log("[WS] Connecting to:", url);
        this.socket = new WebSocket(url);
      } catch (err) {
        this.connectionPromise = null;
        reject(err);
        return;
      }

      // --- USE PROPERTIES ONLY (allows overriding later) ---

      this.socket.onopen = () => {
        console.log("[WS] Connected");
        // Clear setup handlers
        if (this.socket) {
          this.socket.onopen = null;
          this.socket.onerror = null;
        }
        resolve();
      };

      this.socket.onerror = (ev: Event) => {
        console.error("[WS] Connection failed", ev);
        this.connectionPromise = null;
        reject(new Error("WebSocket connection error"));
      };

      this.socket.onclose = () => {
        console.log("[WS] Disconnected");
        this.connectionPromise = null;
        this.socket = null;
      };

      this.socket.onmessage = (ev) => {
        try {
          const json = JSON.parse(ev.data);
          this.onMessage && this.onMessage(json);
        } catch (e) {
          this.onMessage && this.onMessage(ev.data);
        }
      };
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    if (!this.socket) return;

    // CAPTURE THE SPECIFIC SOCKET INSTANCE
    // This prevents the "Time Bomb" from killing the NEW socket (Socket B)
    // if the OLD socket (Socket A) opens later.
    const socketToClose = this.socket;

    // 1. STRIP HANDLERS (The "Nuclear Option")
    socketToClose.onopen = null;
    socketToClose.onclose = null;
    socketToClose.onerror = null;
    socketToClose.onmessage = null;

    if (socketToClose.readyState === WebSocket.CONNECTING) {
      console.log("[WS] Aborting connection attempt...");
      // 2. FORCE CLOSE THE *CAPTURED* SOCKET ONLY
      socketToClose.onopen = () => {
        socketToClose.close();
      };
    } else {
      socketToClose.close();
    }

    // Clear the global reference
    this.socket = null;
    this.connectionPromise = null;
  }

  isConnected(): boolean {
    return !!(this.socket && this.socket.readyState === WebSocket.OPEN);
  }

  sendRequest(request: any): void {
    if (!this.isConnected()) return;
    const message = { MessageType: "REQUEST", Request: request };
    this.socket!.send(JSON.stringify(message));
  }

  sendCommand(requestedState: string): void {
    if (!this.isConnected()) return;
    const message = {
      MessageType: "COMMAND",
      Command: { RequestedState: requestedState },
    };
    this.socket!.send(JSON.stringify(message));
  }
}

export default WebSocketService.getInstance();
