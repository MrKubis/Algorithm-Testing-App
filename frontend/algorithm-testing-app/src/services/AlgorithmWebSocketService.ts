import WebSocketService from "./WebSocketService";
import { AlgorithmRequest } from "./AlgorithmService";

export interface AlgorithmMessage {
  messageType: "REQUEST" | "COMMAND" | "RESPONSE" | "STATUS";
  data?: any;
  error?: string;
  status?: string;
  progress?: number;
}

export class AlgorithmWebSocketService {
  private wsService: WebSocketService;
  private wsUrl: string = "ws://localhost:5046/ws/algorithm";

  constructor() {
    this.wsService = new WebSocketService();
  }

  /**
   * Connect to WebSocket and set up message handler
   */
  async connect(onMessage: (message: any) => void): Promise<void> {
    try {
      await this.wsService.connect(this.wsUrl, (data) => {
        // Pass raw data to handler - let caller decide how to parse
        onMessage(data);
      });
      console.log("WebSocket connected");
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      throw error;
    }
  }

  /**
   * Send algorithm request to backend
   */
  sendRequest(request: any): void {
    this.wsService.sendRequest(request);
  }

  /**
   * Send algorithm request to backend (legacy method name)
   */
  sendAlgorithmRequest(request: AlgorithmRequest): void {
    this.wsService.sendRequest(request);
  }

  /**
   * Send control command (start, pause, stop, resume)
   */
  sendCommand(command: "START" | "PAUSE" | "STOP" | "RESUME"): void {
    this.wsService.sendCommand(command);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.wsService.isConnected();
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.wsService.disconnect();
  }
}

export default AlgorithmWebSocketService;
