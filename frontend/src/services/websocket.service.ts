import { TelemetryPacket } from '../types';

type MessageCallback = (data: TelemetryPacket) => void;
type ConnectionCallback = (connected: boolean) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private messageListeners: Set<MessageCallback> = new Set();
  private connectionListeners: Set<ConnectionCallback> = new Set();
  private reconnectInterval: number = 3000;
  private autoReconnect: boolean = true;
  private isConnecting: boolean = false;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname || 'localhost';
    this.url = import.meta.env.VITE_WS_URL || `${protocol}//${hostname}:8000/ws/status`;
  }

  private connectCount: number = 0;

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    this.connectCount++;

    // Try localhost first, then fallback to Pi IP 192.168.61.135 if localhost fails
    let targetUrl = this.url;
    if (this.connectCount > 2 && window.location.hostname === 'localhost') {
      targetUrl = `ws://10.68.9.203:8000/ws/status`;
    }

    try {
      this.socket = new WebSocket(targetUrl);

      this.socket.onopen = () => {
        console.log('🔌 [WebSocket] Connected to Telemetry Stream:', targetUrl);
        this.isConnecting = false;
        this.notifyConnectionState(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const packet: TelemetryPacket = JSON.parse(event.data);
          this.messageListeners.forEach((callback) => callback(packet));
        } catch (e) {
          console.error('[WebSocket] Error parsing packet:', e);
        }
      };

      this.socket.onclose = () => {
        console.warn('⚠️ [WebSocket] Connection closed');
        this.notifyConnectionState(false);
        if (this.autoReconnect) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ [WebSocket] Error:', error);
        this.socket?.close();
      };
    } catch (err) {
      console.error('[WebSocket] Failed to initialize:', err);
      this.notifyConnectionState(false);
    }
  }

  public disconnect() {
    this.autoReconnect = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public subscribe(onMessage: MessageCallback) {
    this.messageListeners.add(onMessage);
    return () => this.messageListeners.delete(onMessage);
  }

  public onConnectionChange(onStateChange: ConnectionCallback) {
    this.connectionListeners.add(onStateChange);
    return () => this.connectionListeners.delete(onStateChange);
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(payload);
    }
  }

  private notifyConnectionState(connected: boolean) {
    this.connectionListeners.forEach((cb) => cb(connected));
  }
}

export const wsService = new WebSocketService();
export default wsService;
