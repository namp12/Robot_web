import React, { useState, useCallback, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import useTelemetry from '../hooks/useTelemetry';
import { 
  Gamepad2, 
  AlertOctagon, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUpLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowDownRight, 
  Gauge, 
  RotateCcw, 
  RotateCw, 
  ShieldAlert, 
  Cpu, 
  Settings 
} from 'lucide-react';
import robotService from '../services/robot.service';

export const RobotControl: React.FC = () => {
  const { telemetry } = useTelemetry();
  const currentMode = telemetry?.mode || 'MANUAL';
  
  const [speedPercent, setSpeedPercent] = useState<number>(60);
  const [lastCmd, setLastCmd] = useState<string>('STOP');

  const sendMove = useCallback(async (command: string, speedVal?: number) => {
    const activeSpeed = speedVal !== undefined ? speedVal : speedPercent;
    setLastCmd(command);
    
    // Ignore commands if robot is not in MANUAL mode
    if (currentMode !== 'MANUAL' && command !== 'STOP') {
      console.warn(`Control rejected: Robot is currently in ${currentMode} mode.`);
      return;
    }

    try {
      await robotService.setControlCommand({ command, speed: activeSpeed });
    } catch (e) {
      console.error('Failed to send control command', e);
    }
  }, [currentMode, speedPercent]);

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
    // Real-time speed adjustments if robot is moving
    if (lastCmd && lastCmd !== 'STOP' && lastCmd !== 'IDLE' && lastCmd !== 'RESET' && lastCmd !== 'EMERGENCY_STOP') {
      try {
        await robotService.setControlCommand({ command: lastCmd, speed: newSpeed });
      } catch (e) {
        console.error('Speed change control error', e);
      }
    }
  }, [lastCmd]);

  const toggleMode = async (newMode: 'MANUAL' | 'AUTO' | 'ROS') => {
    try {
      await robotService.setMode(newMode);
    } catch (e) {
      console.error('Mode change error', e);
    }
  };

  const isControlDisabled = currentMode !== 'MANUAL';

  return (
    <div className="space-y-6">
      {/* Header and Mode Managers */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-primary-500 animate-pulse" />
            <span>Mecanum Control Panel</span>
          </h1>
          <p className="text-xs text-slate-400">11-Directional Holonomic Drive & Mode Manager</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          <Button
            variant={currentMode === 'MANUAL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => toggleMode('MANUAL')}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
          >
            MANUAL
          </Button>
          <Button
            variant={currentMode === 'AUTO' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => toggleMode('AUTO')}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
          >
            AUTO
          </Button>
          <Button
            variant={currentMode === 'ROS' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => toggleMode('ROS')}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-cyan"
          >
            ROS MODE
          </Button>
        </div>
      </div>

      {/* Mode Alert Status */}
      {isControlDisabled && (
        <div className="flex items-center gap-3 p-4 bg-amber-950/30 border border-amber-900/50 rounded-xl text-amber-300">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 animate-bounce" />
          <div className="text-xs">
            <span className="font-bold">Manual Overrides Suspended:</span> Robot is operating in{' '}
            <span className="font-bold underline text-amber-200">{currentMode} Mode</span>. Web/Bluetooth inputs are blocked until mode is switched to <span className="font-semibold text-slate-200">MANUAL</span>.
          </div>
        </div>
      )}

      {/* Core Driving Interface */}
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

          {/* Telemetry Display Footer */}
          <div className="flex justify-between items-center px-4 py-2 border-t border-slate-900 bg-slate-950/30 text-xs font-mono">
            <span className="text-slate-500">Active Status:</span>
            <span className="text-accent-cyan font-bold uppercase tracking-wider">{telemetry?.robot_status || 'ONLINE'}</span>
            <span className="text-slate-500">| Last Cmd:</span>
            <span className="text-accent-amber font-bold">{lastCmd}</span>
          </div>
        </Card>

        {/* Speed Slider & Emergency Stop */}
        <div className="space-y-6">
          <Card title="Chassis Speed Limit" icon={<Gauge className="w-5 h-5 text-accent-amber" />}>
            <div className="space-y-5 p-2">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-slate-400">PWM Output Level:</span>
                <span className="text-accent-amber font-bold">{speedPercent}% ({Math.round(speedPercent * 2.55)} PWM)</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={speedPercent}
                onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
                className="w-full accent-primary-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10% (Low Torque)</span>
                <span>100% (Max Velocity)</span>
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
                  robotService.setControlCommand({ command: 'STOP', speed: 0 });
                }}
              >
                Reset Drive System
              </Button>
            </div>
          </Card>
        </div>

      </div>

      {/* Keyboard mappings instruction card */}
      <Card title="Keyboard Controller Layout" subtitle="Direct mapping bindings for desktop operation">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-2 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Directions</span>
            <span className="text-slate-300">W / S / A / D / Arrows</span>
          </div>
          <div>
            <span className="text-slate-500 block">Diagonals</span>
            <span className="text-slate-300">U / I / J / K</span>
          </div>
          <div>
            <span className="text-slate-500 block">Rotations</span>
            <span className="text-slate-300">Q (Left) / E (Right)</span>
          </div>
          <div>
            <span className="text-slate-500 block">Halt Motion</span>
            <span className="text-slate-300">Space / Escape</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RobotControl;
