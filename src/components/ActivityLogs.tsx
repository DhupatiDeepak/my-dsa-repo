import React from 'react';
import { Clock, PlusCircle, CheckCircle2, Star, Trash2, Edit3, Flame } from 'lucide-react';
import type { ActivityLog } from '../types';

interface ActivityLogsProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs, onClearLogs }) => {
  
  const getLogIcon = (type: string) => {
    switch (type) {
      case 'doc_added': return <PlusCircle size={16} style={{ color: 'var(--accent)' }} />;
      case 'todo_completed': return <CheckCircle2 size={16} style={{ color: 'var(--color-low)' }} />;
      case 'habit_done': return <Flame size={16} style={{ color: '#f97316' }} />;
      case 'favorite_toggle': return <Star size={16} style={{ color: '#f59e0b' }} />;
      case 'doc_deleted': return <Trash2 size={16} style={{ color: '#ef4444' }} />;
      case 'notes_updated': return <Edit3 size={16} style={{ color: '#8b5cf6' }} />;
      default: return <Clock size={16} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  const formatLogTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + d.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>📈 Activity History</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>A persistent stream of your learning and document achievements.</p>
        </div>
        {logs.length > 0 && (
          <button className="glass-btn" onClick={onClearLogs} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            Clear Logs
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          No activities tracked yet. Start check off lists to build history!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '16px' }}>
          
          {/* Vertical Timeline Bar */}
          <div style={{
            position: 'absolute',
            left: '7px',
            top: '8px',
            bottom: '8px',
            width: '2px',
            background: 'var(--border-color)'
          }} />

          {logs.map((log) => {
            return (
              <div 
                key={log.id} 
                className="animate-slide-in"
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginBottom: '20px', 
                  position: 'relative',
                  alignItems: 'flex-start'
                }}
              >
                {/* Timeline node icon */}
                <div style={{
                  position: 'absolute',
                  left: '-16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '50%',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  boxShadow: '0 0 4px rgba(0,0,0,0.1)'
                }}>
                  {getLogIcon(log.type)}
                </div>

                <div style={{ paddingLeft: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {log.description}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} />
                    <span>{formatLogTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
