import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { Navigation as NavIcon, Send, XCircle, Pause, Play, MapPin, Calendar, Clock, Plus, Trash2, Save } from 'lucide-react';
import navigationService from '../services/navigation.service';
import scheduleService, { PatrolSchedule } from '../services/schedule.service';

interface ScheduledPatrol {
  id?: number;
  mission_name: string;
  start: string;
  end: string;
  days: string[];
  waypoints: Array<{ x: number; y: number; name: string }>;
  active: boolean;
}

export const Navigation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'scheduler'>('manual');
  const [navStatus, setNavStatus] = useState<'IDLE' | 'NAVIGATING' | 'PAUSED' | 'REACHED'>('IDLE');
  
  // Manual navigation state
  const [goalX, setGoalX] = useState<number>(5.2);
  const [goalY, setGoalY] = useState<number>(1.8);
  const [loading, setLoading] = useState<boolean>(false);

  // Patrol Scheduler state
  const [schedName, setSchedName] = useState<string>('Tuần tra Ban Đêm');
  const [startTime, setStartTime] = useState<string>('23:00');
  const [endTime, setEndTime] = useState<string>('05:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [patrolPoints, setPatrolPoints] = useState<Array<{ x: number; y: number; name: string }>>([
    { x: 2.5, y: -1.0, name: 'Điểm tuần tra 1' }
  ]);
  const [newPtX, setNewPtX] = useState<number>(3.0);
  const [newPtY, setNewPtY] = useState<number>(1.5);
  const [newPtName, setNewPtName] = useState<string>('');
  
  const [schedules, setSchedules] = useState<ScheduledPatrol[]>([]);
  const [schedLoading, setSchedLoading] = useState<boolean>(false);

  const daysOfWeek = [
    { key: 'Mon', label: 'T2' },
    { key: 'Tue', label: 'T3' },
    { key: 'Wed', label: 'T4' },
    { key: 'Thu', label: 'T5' },
    { key: 'Fri', label: 'T6' },
    { key: 'Sat', label: 'T7' },
    { key: 'Sun', label: 'CN' }
  ];

  // Fetch saved schedules from backend SQLite patrol_schedules database
  const loadSchedules = async () => {
    setSchedLoading(true);
    try {
      const scheds = await scheduleService.getSchedules();
      const schedList = scheds.map((s: PatrolSchedule) => ({
        id: s.id,
        mission_name: s.name,
        start: s.start_time,
        end: s.end_time,
        days: s.days ? s.days.split(',').filter(Boolean) : [],
        waypoints: JSON.parse(s.waypoints || '[]'),
        active: s.active === 1
      }));
      setSchedules(schedList);
    } catch (err) {
      console.error('Failed to load patrol schedules', err);
    } finally {
      setSchedLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleSendGoal = async () => {
    setLoading(true);
    try {
      await navigationService.sendGoal({ x: goalX, y: goalY });
      setNavStatus('NAVIGATING');
    } catch (err) {
      console.error('Failed to send goal', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGoal = async () => {
    setLoading(true);
    try {
      await navigationService.cancelGoal();
      setNavStatus('IDLE');
    } catch (err) {
      console.error('Failed to cancel goal', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      await navigationService.pause();
      setNavStatus('PAUSED');
    } catch (err) {
      console.error('Failed pause', err);
    }
  };

  const handleResume = async () => {
    try {
      await navigationService.resume();
      setNavStatus('NAVIGATING');
    } catch (err) {
      console.error('Failed resume', err);
    }
  };

  // Scheduler Handlers
  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addPatrolPoint = () => {
    const ptName = newPtName.trim() || `Điểm #${patrolPoints.length + 1}`;
    setPatrolPoints([...patrolPoints, { x: newPtX, y: newPtY, name: ptName }]);
    setNewPtName('');
  };

  const deletePatrolPoint = (index: number) => {
    setPatrolPoints(patrolPoints.filter((_, i) => i !== index));
  };

  const handleSaveSchedule = async () => {
    setLoading(true);
    try {
      const payload: Partial<PatrolSchedule> = {
        name: schedName,
        start_time: startTime,
        end_time: endTime,
        days: selectedDays.join(','),
        waypoints: JSON.stringify(patrolPoints),
        active: 1
      };

      await scheduleService.createSchedule(payload);
      await loadSchedules();
      
      // Reset form
      setSchedName('Tuần tra mới');
      setPatrolPoints([]);
    } catch (err) {
      console.error('Failed to save patrol schedule', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) return;
    try {
      await scheduleService.deleteSchedule(id);
      await loadSchedules();
    } catch (err) {
      console.error('Failed to delete schedule', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <NavIcon className="w-6 h-6 text-accent-cyan" />
            <span>Autonomous Navigation (Nav2)</span>
          </h1>
          <p className="text-xs text-slate-400">Path planning, goal dispatcher & patrol scheduling</p>
        </div>
        
        {/* Tab Selector */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'manual' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Lái tay & Tọa độ
          </button>
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'scheduler' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Lịch trình Tuần tra
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Navigation Map Viewport">
            <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-6 space-y-3 relative">
              <MapPin className="w-10 h-10 text-accent-cyan animate-bounce" />
              <span className="text-sm font-mono text-slate-300">2D Occupancy Grid + Trajectory Visualizer</span>
              {activeTab === 'manual' ? (
                <div className="text-xs font-mono text-slate-500">Target Goal: ({goalX}, {goalY})</div>
              ) : (
                <div className="text-xs font-mono text-slate-500">Đang thiết lập lịch trình: {patrolPoints.length} điểm kiểm tra</div>
              )}
            </div>
          </Card>

          {/* List of Saved Schedules (Visible in Scheduler Tab) */}
          {activeTab === 'scheduler' && (
            <Card title="Danh sách lịch trình tuần tra">
              {schedLoading ? (
                <div className="text-center py-6 text-xs text-slate-500">Đang tải lịch trình...</div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Chưa có lịch trình tuần tra nào được tạo.</div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div>
                        <div className="text-sm font-medium text-slate-200">{s.mission_name}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-mono text-accent-cyan">
                            <Clock className="w-3 h-3" />
                            {s.start} - {s.end}
                          </span>
                          <span>•</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                            {s.days.join(', ')}
                          </span>
                          <span>•</span>
                          <span>{s.waypoints.length} điểm dừng</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="px-2"
                          icon={<Trash2 className="w-4 h-4 text-red-400" />}
                          onClick={() => s.id && handleDeleteSchedule(s.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right side config column */}
        <div className="space-y-6">
          {activeTab === 'manual' ? (
            <>
              <Card title="Goal Dispatcher">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <label className="block text-slate-400 mb-1">Goal X (m)</label>
                      <input
                        type="number"
                        value={goalX}
                        step="0.1"
                        onChange={(e) => setGoalX(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Goal Y (m)</label>
                      <input
                        type="number"
                        value={goalY}
                        step="0.1"
                        onChange={(e) => setGoalY(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button variant="primary" isLoading={loading} className="w-full" icon={<Send className="w-4 h-4" />} onClick={handleSendGoal}>
                      Send Goal Coordinates
                    </Button>
                    <Button variant="danger" isLoading={loading} className="w-full" icon={<XCircle className="w-4 h-4" />} onClick={handleCancelGoal}>
                      Cancel Active Goal
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" icon={<Pause className="w-4 h-4" />} onClick={handlePause}>
                        Pause
                      </Button>
                      <Button variant="outline" icon={<Play className="w-4 h-4" />} onClick={handleResume}>
                        Resume
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Current Pose">
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Position X:</span>
                    <span className="text-slate-100">2.45 m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Position Y:</span>
                    <span className="text-slate-100">-1.12 m</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Heading (Yaw):</span>
                    <span className="text-accent-cyan">45.0°</span>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            /* Patrol Scheduler tab */
            <Card title="Thiết lập Lịch tuần tra">
              <div className="space-y-4 text-xs">
                {/* Mission Name */}
                <div>
                  <label className="block text-slate-400 mb-1">Tên lịch trình</label>
                  <input
                    type="text"
                    value={schedName}
                    onChange={(e) => setSchedName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-primary-500 font-medium"
                  />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="block text-slate-400 mb-1">Bắt đầu</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Kết thúc</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Day of Week Selector */}
                <div>
                  <label className="block text-slate-400 mb-1.5">Lặp lại các ngày</label>
                  <div className="flex justify-between gap-1">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.key}
                        onClick={() => toggleDay(day.key)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] transition-all ${selectedDays.includes(day.key) ? 'bg-accent-cyan text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Waypoints List builder */}
                <div className="border-t border-slate-800 pt-3">
                  <label className="block text-slate-300 font-bold mb-2">Thêm Điểm Dừng</label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <input
                        type="number"
                        placeholder="X (m)"
                        value={newPtX}
                        step="0.1"
                        onChange={(e) => setNewPtX(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Y (m)"
                        value={newPtY}
                        step="0.1"
                        onChange={(e) => setNewPtY(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Tên điểm dừng (Ví dụ: Cổng chính)..."
                        value={newPtName}
                        onChange={(e) => setNewPtName(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                      />
                      <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addPatrolPoint}>
                        Thêm
                      </Button>
                    </div>
                  </div>

                  {/* Waypoints Render list */}
                  <div className="mt-3.5 space-y-1.5 max-h-[140px] overflow-y-auto">
                    {patrolPoints.map((pt, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px]">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center text-[9px] font-bold text-accent-cyan">{i+1}</span>
                          <span>{pt.name} ({pt.x}, {pt.y})</span>
                        </div>
                        <button onClick={() => deletePatrolPoint(i)} className="text-red-400 hover:text-red-300">
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  variant="primary" 
                  isLoading={loading} 
                  className="w-full mt-2" 
                  icon={<Save className="w-4 h-4" />} 
                  onClick={handleSaveSchedule}
                  disabled={patrolPoints.length === 0}
                >
                  Lưu lịch trình tuần tra
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
