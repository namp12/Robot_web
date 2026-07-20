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
    const host = window.location.host;
    this.url = import.meta.env.VITE_WS_URL || `${protocol}//${host}/ws/status`;
  }

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('🔌 [WebSocket] Connected to Telemetry Stream:', this.url);
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

  private notifyConnectionState(connected: boolean) {
    this.connectionListeners.forEach((cb) => cb(connected));
  }
}

export const wsService = new WebSocketService();
export default wsService;
