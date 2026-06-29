import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PomodoroProps {
  onSessionComplete: () => void;
}

export const Pomodoro: React.FC<PomodoroProps> = ({ onSessionComplete }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Play a beautiful synthetic beep using browser's AudioContext
  const playAlarmSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn("AudioContext failed to play sound: ", e);
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer expired
            setIsActive(false);
            playAlarmSound();
            setSessionsToday(prev => prev + 1);
            onSessionComplete();
            setMinutes(25);
            setSeconds(0);
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, minutes, seconds]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
  };

  // Math for Circular SVG ring
  const totalTime = 25 * 60;
  const timeRemaining = minutes * 60 + seconds;
  const strokeDashoffset = 314 - (314 * (totalTime - timeRemaining)) / totalTime;

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>⏳ Focus Pomodoro</h4>
      
      <div className="pomodoro-ring-container">
        <svg width="120" height="120">
          <circle 
            cx="60" cy="60" r="50" 
            stroke="var(--border-color)" 
            strokeWidth="8" 
            fill="transparent" 
          />
          <circle 
            cx="60" cy="60" r="50" 
            stroke="var(--accent)" 
            strokeWidth="8" 
            fill="transparent" 
            strokeDasharray="314"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="progress-ring"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="pomodoro-timer-text">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="glass-btn" onClick={toggleTimer} style={{ padding: '6px 12px', fontSize: '13px' }}>
          {isActive ? <Pause size={14} /> : <Play size={14} />}
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button className="glass-btn" onClick={resetTimer} style={{ padding: '6px' }}>
          <RotateCcw size={14} />
        </button>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        Sessions Completed Today: <strong>{sessionsToday}</strong>
      </div>
    </div>
  );
};
