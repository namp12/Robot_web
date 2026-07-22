import React, { useState, useCallback, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Gamepad2, AlertOctagon, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Gauge, RotateCcw } from 'lucide-react';
import robotService from '../services/robot.service';

export const RobotControl: React.FC = () => {
  const [speed, setSpeed] = useState(0.5);
  const [mode, setMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [lastCmd, setLastCmd] = useState('IDLE');

  const sendMove = useCallback(async (linear: number, angular: number, label: string) => {
    setLastCmd(label);
    try {
      await robotService.setControlCommand({ linear: linear * speed, angular: angular * speed });
    } catch (e) {
      console.error('Move error', e);
    }
  }, [speed]);

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
          sendMove(1.0, 0.0, 'FORWARD');
          break;
        case 's':
        case 'arrowdown':
          sendMove(-1.0, 0.0, 'BACKWARD');
          break;
        case 'a':
        case 'arrowleft':
          sendMove(0.0, 1.0, 'LEFT');
          break;
        case 'd':
        case 'arrowright':
          sendMove(0.0, -1.0, 'RIGHT');
          break;
        case ' ':
          sendMove(0.0, 0.0, 'STOP');
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        sendMove(0.0, 0.0, 'STOP');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [sendMove]);

  const toggleMode = async (newMode: 'MANUAL' | 'AUTO') => {
    setMode(newMode);
    await robotService.setMode(newMode);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-primary-500" />
            <span>Robot Remote Control</span>
          </h1>
          <p className="text-xs text-slate-400">Manual WASD / Joystick drive & mode selection</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'MANUAL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => toggleMode('MANUAL')}
          >
            MANUAL DRIVE
          </Button>
          <Button
            variant={mode === 'AUTO' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => toggleMode('AUTO')}
          >
            AUTO MODE
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WASD Directional Controls */}
        <Card title="WASD Directional Drive" subtitle="Keyboard or Click Controls">
          <div className="flex flex-col items-center justify-center p-6 space-y-3">
            <Button
              variant="secondary"
              className="w-16 h-16 rounded-2xl font-bold text-lg shadow-lg"
              onClick={() => sendMove(1.0, 0.0, 'FORWARD')}
            >
              <ArrowUp className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                className="w-16 h-16 rounded-2xl font-bold text-lg shadow-lg"
                onClick={() => sendMove(0.0, 1.0, 'LEFT')}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="danger"
                className="w-16 h-16 rounded-2xl font-bold text-xs shadow-lg"
                onClick={() => sendMove(0.0, 0.0, 'STOP')}
              >
                STOP
              </Button>
              <Button
                variant="secondary"
                className="w-16 h-16 rounded-2xl font-bold text-lg shadow-lg"
                onClick={() => sendMove(0.0, -1.0, 'RIGHT')}
              >
                <ArrowRight className="w-6 h-6" />
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-16 h-16 rounded-2xl font-bold text-lg shadow-lg"
              onClick={() => sendMove(-1.0, 0.0, 'BACKWARD')}
            >
              <ArrowDown className="w-6 h-6" />
            </Button>
          </div>
          <div className="text-center text-xs font-mono text-slate-400 mt-2">
            Last Command: <span className="text-accent-cyan font-bold">{lastCmd}</span>
          </div>
        </Card>

        {/* Speed Slider & Emergency Stop */}
        <div className="space-y-6">
          <Card title="Max Speed Control" icon={<Gauge className="w-5 h-5 text-accent-amber" />}>
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-slate-400">Target Speed Limit:</span>
                <span className="text-accent-amber font-bold">{Math.round(speed * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-primary-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono">
                <span>0.1 m/s (Slow)</span>
                <span>1.0 m/s (Fast)</span>
              </div>
            </div>
          </Card>

          <Card title="Safety & Emergency" icon={<AlertOctagon className="w-5 h-5 text-rose-500" />}>
            <div className="flex flex-col gap-3">
              <Button
                variant="danger"
                size="lg"
                className="w-full py-4 text-base font-bold tracking-wider shadow-lg shadow-rose-950"
                icon={<AlertOctagon className="w-6 h-6" />}
                onClick={() => sendMove(0, 0, 'EMERGENCY_STOP')}
              >
                EMERGENCY STOP (E-STOP)
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => setLastCmd('RESET')}
              >
                Reset Drive System
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RobotControl;
