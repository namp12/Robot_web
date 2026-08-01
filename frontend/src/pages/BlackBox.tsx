import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import { blackboxService } from '../services';
import { BlackBoxLog } from '../types';
import {
  Archive,
  Search,
  Filter,
  RefreshCw,
  Cpu,
  Battery,
  Wifi,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Database,
  MapPin,
  Code,
  Copy,
  Activity
} from 'lucide-react';

interface SensorData {
  imu?: { x: number; y: number; z: number; w: number };
  imu_raw?: {
    accel: { x: number; y: number; z: number };
    gyro: { x: number; y: number; z: number };
  };
  roll?: number;
  pitch?: number;
  front_distance?: number;
  rear_distance?: number;
  encoder_distance?: number;
  encoders?: { fl: number; fr: number; rl: number; rr: number };
}

export const BlackBox: React.FC = () => {
  const [logs, setLogs] = useState<BlackBoxLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [eventFilter, setEventFilter] = useState<string>('ALL');
  
  // WebSocket states
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Selected/Expanded row for detailed telemetry
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Fetch initial history logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await blackboxService.getLogs();
      // Sort desc by ID or timestamp
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setLogs(sorted);
      
      // Auto expand the first row if available
      if (sorted.length > 0 && selectedLogId === null) {
        setSelectedLogId(sorted[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError('Không thể tải nhật ký hành trình từ cơ sở dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  // Connect to real-time BlackBox WebSocket
  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setWsStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/blackbox`;

    console.log(`🔌 [BlackBox WS] Connecting to ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('✅ [BlackBox WS] Connected successfully');
      setWsStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const newLog: BlackBoxLog = JSON.parse(event.data);
        setLogs((prevLogs) => {
          // Check for duplicate ID
          if (prevLogs.some(log => log.id === newLog.id)) {
            return prevLogs;
          }
          const updated = [newLog, ...prevLogs];
          // Limit to max 200 records to prevent memory exhaustion
          return updated.slice(0, 200);
        });
      } catch (err) {
        console.error('❌ [BlackBox WS] Failed to parse message:', err);
      }
    };

    socket.onclose = () => {
      console.warn('⚠️ [BlackBox WS] Connection closed');
      setWsStatus('disconnected');
      
      // Try to reconnect in 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    socket.onerror = (err) => {
      console.error('❌ [BlackBox WS] Error:', err);
      socket.close();
    };
  };

  useEffect(() => {
    fetchLogs();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Parse sensor data safely
  const parseSensorData = (sensorDataStr: string | undefined): SensorData | null => {
    if (!sensorDataStr) return null;
    try {
      return JSON.parse(sensorDataStr);
    } catch (e) {
      return null;
    }
  };

  // Copy raw JSON to clipboard
  const handleCopyJson = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get unique event types for filtering
  const eventTypes = ['ALL', ...Array.from(new Set(logs.map((log) => log.event)))];

  // Filter logs based on search query and event filter
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toString().includes(searchTerm) ||
      (log.timestamp && log.timestamp.includes(searchTerm));
    const matchesEvent = eventFilter === 'ALL' || log.event === eventFilter;
    return matchesSearch && matchesEvent;
  });

  // Calculate statistics from current logs
  const totalCount = logs.length;
  const latestLog = logs[0];
  const avgBattery = totalCount > 0 
    ? (logs.reduce((sum, log) => sum + (log.battery ?? 0), 0) / totalCount).toFixed(1)
    : 'N/A';
  const avgCpu = totalCount > 0 
    ? (logs.reduce((sum, log) => sum + (log.cpu ?? 0), 0) / totalCount).toFixed(1)
    : 'N/A';

  // Selected log object
  const selectedLog = logs.find(log => log.id === selectedLogId) || latestLog;
  const parsedSensors = selectedLog ? parseSensorData(selectedLog.sensor_data) : null;

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  // Badge styler for events
  const getEventBadgeClass = (event: string) => {
    switch (event) {
      case 'PATROL_STARTED':
      case 'MISSION_RECORD':
      case 'PATROL_COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'WAYPOINT_REACHED':
      case 'MANUAL_SNAPSHOT':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'EMERGENCY_STOP':
      case 'E_STOP':
      case 'SYSTEM_FAULT':
        return 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse';
      case 'SPAM_TEST':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  // Trajectory Plotter Coordinates
  const points = logs
    .filter(log => typeof log.pos_x === 'number' && typeof log.pos_y === 'number')
    .map(log => ({ x: log.pos_x, y: log.pos_y, event: log.event }));

  // Grid coordinates scaling logic
  let minX = -2, maxX = 2, minY = -2, maxY = 2;
  if (points.length > 0) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    minX = Math.min(...xs) - 0.5;
    maxX = Math.max(...xs) + 0.5;
    minY = Math.min(...ys) - 0.5;
    maxY = Math.max(...ys) + 0.5;
  }
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scaleX = (x: number) => ((x - minX) / rangeX) * 80 + 10;
  const scaleY = (y: number) => 90 - ((y - minY) / rangeY) * 80;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Archive className="w-6 h-6 text-status-warning" />
            <span>Operational BlackBox Recorder</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ghi nhận vết hành trình, trạng thái cảm biến thời gian thực của Robot (Zero Latency)
          </p>
        </div>

        {/* WebSocket Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Trạng thái:</span>
            {wsStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Thời gian thực
              </span>
            )}
            {wsStatus === 'connecting' && (
              <span className="flex items-center gap-1.5 text-status-warning font-semibold animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-status-warning"></span>
                </span>
                Đang kết nối...
              </span>
            )}
            {wsStatus === 'disconnected' && (
              <span className="flex items-center gap-2 text-status-error font-semibold">
                <span className="h-2 w-2 rounded-full bg-status-error"></span>
                Mất kết nối
                <button
                  onClick={connectWebSocket}
                  className="px-2 py-0.5 bg-status-error/20 hover:bg-status-error/30 text-[10px] text-white rounded border border-status-error/30"
                >
                  Kết nối lại
                </button>
              </span>
            )}
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tổng bản ghi</p>
              <h3 className="text-xl font-bold text-slate-100 font-mono mt-1">{totalCount}</h3>
            </div>
            <div className="p-2 bg-primary-500/10 text-primary-500 rounded-xl border border-primary-500/20">
              <Database className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pin trung bình</p>
              <h3 className="text-xl font-bold text-emerald-400 font-mono mt-1">{avgBattery}%</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
              <Battery className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">CPU trung bình</p>
              <h3 className="text-xl font-bold text-cyan-400 font-mono mt-1">{avgCpu}%</h3>
            </div>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sự kiện mới nhất</p>
              <h3 className="text-xs font-bold text-slate-200 mt-2 truncate max-w-[130px] font-mono">
                {latestLog ? latestLog.event : 'Trống'}
              </h3>
            </div>
            <div className="p-2 bg-status-warning/10 text-status-warning rounded-xl border border-status-warning/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Table (Left) + Detail & Trajectory (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Logs Table (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0 overflow-hidden">
            {/* Table Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-800/80 bg-slate-900/60">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm mã, sự kiện, thời gian..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
                >
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'ALL' ? 'Tất cả sự kiện' : type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
              {loading && logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
                  <p className="text-xs">Đang truy vấn lịch sử hộp đen...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-status-error">
                  <AlertTriangle className="w-8 h-8" />
                  <p className="text-xs">{error}</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  Không tìm thấy bản ghi hộp đen nào trùng khớp.
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase border-b border-slate-800/80 sticky top-0 backdrop-blur">
                    <tr>
                      <th className="px-4 py-3 text-center w-10">Mã</th>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Sự kiện</th>
                      <th className="px-4 py-3">Tọa độ (X, Y)</th>
                      <th className="px-4 py-3 text-center">Pin</th>
                      <th className="px-4 py-3 text-center">CPU/RAM</th>
                      <th className="px-4 py-3 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {filteredLogs.map((log) => {
                      const isSelected = selectedLogId === log.id;
                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLogId(log.id)}
                          className={`hover:bg-slate-800/20 cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary-500/10 hover:bg-primary-500/15' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-center text-slate-500 font-semibold">{log.id}</td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getEventBadgeClass(log.event)}`}>
                              {log.event}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {log.pos_x !== undefined && log.pos_y !== undefined
                              ? `(${log.pos_x.toFixed(2)}, ${log.pos_y.toFixed(2)})`
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={log.battery && log.battery < 20 ? 'text-status-error font-bold' : 'text-slate-200'}>
                              {log.battery}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-400">
                            {log.cpu}% / {log.ram}%
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white">
                              {isSelected ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Dashboard Right: Trajectory & Telemetry Details */}
        <div className="space-y-6">
          {/* Path Trajectory Visual Map */}
          <Card title="Vết Hành Trình Di Chuyển (2D Path)" icon={<MapPin className="w-4 h-4" />}>
            <div className="space-y-3">
              <div className="relative">
                {points.length === 0 ? (
                  <div className="h-48 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                    Chưa có vết tọa độ di chuyển
                  </div>
                ) : (
                  <svg viewBox="0 0 100 100" className="w-full h-48 bg-slate-950/80 rounded-xl border border-slate-800 p-2 shadow-inner">
                    {/* Horizontal & Vertical grid indicators */}
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                    
                    {/* Coordinate axis labels */}
                    <text x="5" y="47" className="text-[4px] fill-slate-600 font-mono">X-Axis</text>
                    <text x="52" y="95" className="text-[4px] fill-slate-600 font-mono">Y-Axis</text>
                    
                    {/* Route line */}
                    {points.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_0_6px_rgba(37,99,235,0.7)]"
                        points={points.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' ')}
                      />
                    )}

                    {/* Historical points */}
                    {points.slice(1).map((p, idx) => (
                      <circle
                        key={idx}
                        cx={scaleX(p.x)}
                        cy={scaleY(p.y)}
                        r="1.2"
                        fill="#334155"
                        stroke="#475569"
                        strokeWidth="0.3"
                      />
                    ))}

                    {/* Current Position (First index is latest due to sort desc) */}
                    {points.length > 0 && (
                      <g className="relative">
                        <circle
                          cx={scaleX(points[0].x)}
                          cy={scaleY(points[0].y)}
                          r="4"
                          fill="#10b981"
                          fillOpacity="0.25"
                          className="animate-ping origin-center"
                          style={{ transformOrigin: `${scaleX(points[0].x)}px ${scaleY(points[0].y)}px` }}
                        />
                        <circle
                          cx={scaleX(points[0].x)}
                          cy={scaleY(points[0].y)}
                          r="2"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="0.5"
                        />
                      </g>
                    )}
                  </svg>
                )}
                {/* SVG Coordinate Legends */}
                <div className="absolute top-2 right-2 text-[10px] text-slate-500 font-mono bg-slate-900/90 border border-slate-800 rounded px-1.5 py-0.5">
                  Lưới tỉ lệ: {minX.toFixed(1)} đến {maxX.toFixed(1)}m
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block border border-white"></span>Vị trí hiện tại</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary-500 inline-block"></span>Lịch sử di chuyển</span>
              </div>
            </div>
          </Card>

          {/* Log Telemetry sensor detailed viewer */}
          {selectedLog ? (
            <Card
              title={`Thông Số Snapshot ID: ${selectedLog.id}`}
              subtitle={formatDate(selectedLog.timestamp)}
              icon={<Cpu className="w-4 h-4 text-emerald-400" />}
            >
              <div className="space-y-4 text-xs font-mono">
                {/* Pos & Speed Metrics */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Tọa Độ (Pose)</span>
                    <span className="text-slate-200 block text-xs mt-0.5">
                      X: {selectedLog.pos_x?.toFixed(3)}
                    </span>
                    <span className="text-slate-200 block text-xs">
                      Y: {selectedLog.pos_y?.toFixed(3)}
                    </span>
                    <span className="text-slate-200 block text-xs">
                      Yaw: {selectedLog.yaw?.toFixed(1)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Vận tốc (Velocity)</span>
                    <span className="text-slate-200 block text-xs mt-0.5">
                      Tuyến tính: {selectedLog.linear_speed?.toFixed(2)} m/s
                    </span>
                    <span className="text-slate-200 block text-xs">
                      Góc quay: {selectedLog.angular_speed?.toFixed(2)} rad/s
                    </span>
                  </div>
                </div>

                {/* Subsystem sensor data if available */}
                {parsedSensors ? (
                  <div className="space-y-3">
                    {/* Distance Sensors */}
                    <div className="border-t border-slate-800/60 pt-3">
                      <span className="text-[10px] text-slate-500 block uppercase mb-1">Cảm Biến Tránh Vật Cản (Lidar Dist)</span>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div className="bg-slate-900 p-2 rounded border border-slate-800/50">
                          Khoảng cách trước: <span className="text-emerald-400">{parsedSensors.front_distance?.toFixed(2)}m</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded border border-slate-800/50">
                          Khoảng cách sau: <span className="text-emerald-400">{parsedSensors.rear_distance?.toFixed(2)}m</span>
                        </div>
                      </div>
                    </div>

                    {/* IMU Orientation angles */}
                    <div className="border-t border-slate-800/60 pt-3">
                      <span className="text-[10px] text-slate-500 block uppercase mb-1">Cảm Biến IMU (Roll / Pitch / Yaw)</span>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-slate-300 text-[11px]">
                        <div className="bg-slate-900 p-1.5 rounded border border-slate-800/50">
                          <span className="text-slate-500 text-[9px] block">ROLL</span>
                          <span className="text-cyan-400 font-semibold">{parsedSensors.roll?.toFixed(2)}°</span>
                        </div>
                        <div className="bg-slate-900 p-1.5 rounded border border-slate-800/50">
                          <span className="text-slate-500 text-[9px] block">PITCH</span>
                          <span className="text-cyan-400 font-semibold">{parsedSensors.pitch?.toFixed(2)}°</span>
                        </div>
                        <div className="bg-slate-900 p-1.5 rounded border border-slate-800/50">
                          <span className="text-slate-500 text-[9px] block">YAW</span>
                          <span className="text-emerald-400 font-semibold">{selectedLog.yaw?.toFixed(1)}°</span>
                        </div>
                      </div>
                    </div>

                    {/* Encoders wheel data */}
                    {parsedSensors.encoders && (
                      <div className="border-t border-slate-800/60 pt-3">
                        <span className="text-[10px] text-slate-500 block uppercase mb-1">Encoders Bánh Xe (Wheel Odometry)</span>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-800/50 text-[11px] space-y-1 text-slate-300">
                          <div className="grid grid-cols-2">
                            <span>Trước Trái (FL): {parsedSensors.encoders.fl?.toFixed(1)}</span>
                            <span>Trước Phải (FR): {parsedSensors.encoders.fr?.toFixed(1)}</span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span>Sau Trái (RL): {parsedSensors.encoders.rl?.toFixed(1)}</span>
                            <span>Sau Phải (RR): {parsedSensors.encoders.rr?.toFixed(1)}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5 mt-1">
                            Tổng quãng đường mã hóa: {parsedSensors.encoder_distance?.toFixed(2)} m
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs text-center py-4 border-t border-slate-800/60">
                    Không có thông tin cảm biến bổ sung cho nhật ký này.
                  </div>
                )}

                {/* Raw JSON Expander */}
                <div className="border-t border-slate-800/60 pt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-500 uppercase">Dữ Liệu JSON Thô</span>
                    <button
                      onClick={() => handleCopyJson(selectedLog.sensor_data || '{}', selectedLog.id)}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedId === selectedLog.id ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[10px] max-h-32 text-emerald-500 select-all scrollbar-thin">
                    {selectedLog.sensor_data ? JSON.stringify(JSON.parse(selectedLog.sensor_data), null, 2) : '{}'}
                  </pre>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8 text-slate-500 text-xs">
                Chọn một hàng trong bảng để xem thông số cảm biến chi tiết.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlackBox;
