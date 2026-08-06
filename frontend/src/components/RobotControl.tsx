import React, { useState, useCallback, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import useTelemetry from '../hooks/useTelemetry';
import { 
  Gamepad2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUpLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowDownRight, 
  RotateCcw, 
  RotateCw, 
  Cpu, 
  Gauge, 
  AlertOctagon, 
  Settings 
} from 'lucide-react';
import robotService from '../services/robot.service';
import wsService from '../services/websocket.service';

export const RobotControl: React.FC = () => {
  const { telemetry } = useTelemetry();
  const rawMode = (telemetry?.mode || 'MANUAL').toUpperCase();
  const isManual = rawMode.includes('MANUAL') || rawMode === 'IDLE' || rawMode === 'ONLINE' || rawMode === 'OK';
  const currentMode = isManual ? 'MANUAL' : rawMode;
  
  // Persist speed in localStorage, default to 70% (Standard 70 PWM)
  const [speedPercent, setSpeedPercentState] = useState<number>(() => {
    const saved = localStorage.getItem('robot_control_speed');
    const parsed = saved ? parseInt(saved, 10) : 70;
    return isNaN(parsed) || parsed < 20 ? 70 : parsed;
  });

  const [lastCmd, setLastCmd] = useState<string>('STOP');

  const setSpeedPercent = useCallback((val: number) => {
    const clamped = Math.max(20, Math.min(100, val));
    setSpeedPercentState(clamped);
    localStorage.setItem('robot_control_speed', clamped.toString());
  }, []);

  const sendMove = useCallback(async (command: string, speedVal?: number) => {
    const activeSpeed = speedVal !== undefined ? speedVal : speedPercent;
    setLastCmd(command);

    // 1. Send instant 0ms command via WebSocket persistent pipe if connected
    if (wsService.isConnected()) {
      wsService.send({
        type: 'move',
        command: command,
        speed: activeSpeed
      });
      return;
    }

    // 2. Fallback to HTTP POST only when WebSocket is disconnected
    try {
      await robotService.setControlCommand({ command, speed: activeSpeed });
    } catch (e) {
      console.error('Failed to send control command', e);
    }
  }, [speedPercent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) || e.key === ' ') {
        e.preventDefault();
      }

      if (e.repeat) return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          sendMove('FORWARD');
          break;
        case 's':
        case 'arrowdown':
          sendMove('BACKWARD');
          break;
        case 'a':
        case 'arrowleft':
          sendMove('STRAFE_LEFT');
          break;
        case 'd':
        case 'arrowright':
          sendMove('STRAFE_RIGHT');
          break;
        case 'q':
          sendMove('ROTATE_LEFT');
          break;
        case 'e':
          sendMove('ROTATE_RIGHT');
          break;
        case 'u':
          sendMove('DIAGONAL_FRONT_LEFT');
          break;
        case 'i':
          sendMove('DIAGONAL_FRONT_RIGHT');
          break;
        case 'j':
          sendMove('DIAGONAL_REAR_LEFT');
          break;
        case 'k':
          sendMove('DIAGONAL_REAR_RIGHT');
          break;
        case ' ':
        case 'escape':
          sendMove('STOP');
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd', 'q', 'e', 'u', 'i', 'j', 'k', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        sendMove('STOP');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [sendMove]);

  const handleSpeedChange = useCallback(async (newSpeed: number) => {
    setSpeedPercent(newSpeed);
    // Notify backend & ROS of updated speed setting immediately
    if (wsService.isConnected()) {
      wsService.send({
        type: 'speed',
        speed: newSpeed
      });
    }
    if (lastCmd && lastCmd !== 'STOP' && lastCmd !== 'IDLE' && lastCmd !== 'RESET' && lastCmd !== 'EMERGENCY_STOP') {
      try {
        await sendMove(lastCmd, newSpeed);
      } catch (e) {
        console.error('Speed change control error', e);
      }
    }
  }, [lastCmd, sendMove, setSpeedPercent]);

  const isControlDisabled = currentMode !== 'MANUAL';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Mecanum Directional Control Grid */}
      <Card title="Holonomic Drive Matrix" subtitle="Mecanum steering geometry (WASD / Keyboard mapping)">
        <div className="relative flex flex-col items-center justify-center p-6 space-y-4">
          
          {/* Control Disabled overlay */}
          {isControlDisabled && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl border border-slate-800/80 text-center p-6">
              <Cpu className="w-12 h-12 text-slate-500 mb-2 animate-pulse" />
              <h3 className="font-bold text-slate-300 text-sm">Control Locked</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Manual controls are currently disabled in {currentMode} mode. Switch back to MANUAL to use these controls.
              </p>
            </div>
          )}

          {/* 3x3 Mecanum Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-[340px] w-full">
            {/* Row 1 */}
            <Button
              variant="secondary"
              disabled={isControlDisabled}
              className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] tracking-tighter"
              onClick={() => sendMove('DIAGONAL_FRONT_LEFT')}
              title="Diagonal Front Left (U)"
            >
              <ArrowUpLeft className="w-6 h-6 text-slate-400" />
              <span>DIA FL</span>
            </Button>

            <Button
              variant="secondary"
              disabled={isControlDisabled}
              className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] tracking-tighter"
              onClick={() => sendMove('FORWARD')}
              title="Forward (W / Up)"
            >
              <ArrowUp className="w-6 h-6 text-primary-500" />
              <span>FORWARD</span>
            </Button>

            <Button
              variant="secondary"
              disabled={isControlDisabled}
              className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] tracking-tighter"
              onClick={() => sendMove('DIAGONAL_FRONT_RIGHT')}
              title="Diagonal Front Right (I)"
            >
              <ArrowUpRight className="w-6 h-6 text-slate-400" />
              <span>DIA FR</span>
            </Button>

            {/* Row 2 */}
            <Button
              variant="secondary"
              disabled={isControlDisabled}
              className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] tracking-tighter"
              onClick={() => sendMove('STRAFE_LEFT')}
              title="Strafe Left (A / Left)"
            >
              <ArrowLeft className="w-6 h-6 text-accent-cyan" />
              <span>STRAFE L</span>
            </Button>

            <Button
              variant="danger"
              disabled={isControlDisabled}
              className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-xs font-bold font-mono tracking-tighter shadow-lg shadow-rose-950/20"
              onClick={() => sendMove('STOP')}
              title="Stop (Space)"
            >
              <span className="text-rose-100 text-sm">STOP</span>
            </Button>

            <Button
              variant="secondary"
              disabled={isControlDisabled}
              className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] tracking-tighter"
              onClick={() => sendMove('STRAFE_RIGHT')}
              title="Strafe Right (D / Right)"
            >
              <ArrowRight className="w-6 h-6 text-accent-cyan" />
              <span>STRAFE R</span>
            </Button>

            {/* Row 3 */}
            <Button
              variant="secondary"
              disabled={isControlDisabled}
              className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] tracking-tighter"
              onClick={() => sendMove('DIAGONAL_REAR_LEFT')}
              title="Diagonal Rear Left (J)"
            >
              <ArrowDownLeft className="w-6 h-6 text-slate-400" />
              <span>DIA RL</span>
            </Button>

            <Button
              variant="secondary"
              disabled={isControlDisabled}
              className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] tracking-tighter"
              onClick={() => sendMove('BACKWARD')}
              title="Backward (S / Down)"
            >
              <ArrowDown className="w-6 h-6 text-primary-500" />
              <span>BACKWARD</span>
            </Button>

            <Button
              variant="secondary"
              disabled={isControlDisabled}
              className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] tracking-tighter"
              onClick={() => sendMove('DIAGONAL_REAR_RIGHT')}
              title="Diagonal Rear Right (K)"
            >
              <ArrowDownRight className="w-6 h-6 text-slate-400" />
              <span>DIA RR</span>
            </Button>
          </div>

          {/* Rotational controls (Row 4) */}
          <div className="flex gap-4 w-full max-w-[340px] pt-2">
            <Button
              variant="outline"
              disabled={isControlDisabled}
              className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold"
              onClick={() => sendMove('ROTATE_LEFT')}
              title="Rotate Left (Q)"
            >
              <RotateCcw className="w-4 h-4 text-accent-amber" />
              <span>ROTATE L</span>
            </Button>
            <Button
              variant="outline"
              disabled={isControlDisabled}
              className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold"
              onClick={() => sendMove('ROTATE_RIGHT')}
              title="Rotate Right (E)"
            >
              <RotateCw className="w-4 h-4 text-accent-amber" />
              <span>ROTATE R</span>
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center px-4 py-2 border-t border-slate-900 bg-slate-950/30 text-xs font-mono">
          <span className="text-slate-500">Last Cmd:</span>
          <span className="text-accent-amber font-bold">{lastCmd}</span>
        </div>
      </Card>

      {/* Speed & Emergency Controls */}
      <div className="space-y-6">
        <Card title="Chassis Speed Limit" icon={<Gauge className="w-5 h-5 text-accent-amber" />}>
          <div className="space-y-5 p-2">
            <div className="flex justify-between items-center text-sm font-mono">
              <span className="text-slate-400">PWM Output Level:</span>
              <span className="text-accent-amber font-bold text-base">{speedPercent}% ({Math.round(speedPercent * 2.55)} PWM)</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={speedPercent}
              onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-3 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>20% (Low Torque)</span>
              <span>70% (Default Safe)</span>
              <span>100% (Max)</span>
            </div>

            {/* Quick Speed Preset Buttons */}
            <div className="pt-2">
              <span className="text-[11px] font-mono text-slate-400 block mb-2">QUICK SPEED PRESETS:</span>
              <div className="grid grid-cols-4 gap-2">
                {[30, 50, 70, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSpeedChange(preset)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                      speedPercent === preset
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md shadow-amber-950/40 scale-105'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Critical Commands" icon={<AlertOctagon className="w-5 h-5 text-rose-500" />}>
          <div className="flex flex-col gap-3 p-1">
            <Button
              variant="danger"
              size="lg"
              className="w-full py-4 text-base font-bold tracking-wider shadow-lg shadow-rose-950/40"
              icon={<AlertOctagon className="w-6 h-6 text-white animate-bounce" />}
              onClick={() => sendMove('STOP')}
            >
              EMERGENCY STOP (E-STOP)
            </Button>
            <Button
              variant="outline"
              size="md"
              className="w-full flex items-center justify-center gap-2 text-slate-300 hover:text-white"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => {
                setLastCmd('RESET');
                sendMove('STOP', 0);
              }}
            >
              Reset Drive System
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RobotControl;
