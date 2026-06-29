import React, { useRef } from 'react';
import { Moon, Sun, Download, Upload, RotateCcw, ShieldCheck } from 'lucide-react';
import type { UserSettings } from '../types';

interface SettingsProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onImportData: (jsonData: string) => boolean;
  onExportData: () => string;
  onResetData: () => void;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings, onUpdateSettings, onImportData, onExportData, onResetData, onAddToast
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ ...settings, theme: nextTheme });
    onAddToast(`Switched to ${nextTheme === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️'}`, 'info');
  };

  const changeAccent = (color: UserSettings['accentColor']) => {
    onUpdateSettings({ ...settings, accentColor: color });
    onAddToast(`Accent highlight updated to ${color.toUpperCase()}`, 'success');
  };

  const handleExport = () => {
    try {
      const dataStr = onExportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DocTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onAddToast('Backup JSON exported successfully!', 'success');
    } catch {
      onAddToast('Failed to export backup data.', 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const success = onImportData(text);
        if (success) {
          onAddToast('Data imported and restored successfully! Reloading...', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          onAddToast('Invalid backup file structure.', 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input selection
  };

  const handleReset = () => {
    onResetData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
      
      {/* Visual Settings Header */}
      <div>
        <h3>⚙️ Customization & Settings</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Configure themes, custom accent highlights, and manage backups.</p>
      </div>

      {/* Theme selection */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontWeight: 600 }}>Visual Theme Mode</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Toggle between standard dark mode and crisp light mode.</p>
        </div>
        <button className="glass-btn" onClick={toggleTheme} style={{ minWidth: '130px', justifyContent: 'center' }}>
          {settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>

      {/* Accent Colors */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h4 style={{ fontWeight: 600 }}>Accent Focus Glow</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select color theme variables applied across indicators and charts.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
          {(['cyan', 'emerald', 'purple', 'amber'] as UserSettings['accentColor'][]).map((col) => {
            const hex = 
              col === 'cyan' ? '#06b6d4' : 
              col === 'emerald' ? '#10b981' : 
              col === 'purple' ? '#8b5cf6' : '#f59e0b';
            
            return (
              <button
                key={col}
                onClick={() => changeAccent(col)}
                style={{
                  flexGrow: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.accentColor === col ? `2px solid ${hex}` : '1px solid var(--glass-border)',
                  backgroundColor: settings.accentColor === col ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--glass-input-bg)',
                  color: hex,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: hex }} />
                {col}
              </button>
            );
          })}
        </div>
      </div>

      {/* Export & Import */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h4 style={{ fontWeight: 600 }}>Backup and Data Migration</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Export data as JSON to copy to another browser, or restore previous files.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="glass-btn" onClick={handleExport} style={{ flexGrow: 1, justifyContent: 'center' }}>
            <Download size={16} /> Export Backup
          </button>
          
          <button className="glass-btn" onClick={handleImportClick} style={{ flexGrow: 1, justifyContent: 'center' }}>
            <Upload size={16} /> Import Backup
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>

      {/* Factory Reset */}
      <div className="glass-card" style={{ padding: '20px', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontWeight: 600, color: '#ef4444' }}>Danger Zone</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Reset all progress, streaks, habits, and uploaded documents to defaults.</p>
        </div>
        
        <button className="glass-btn" onClick={handleReset} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <RotateCcw size={16} /> Factory Reset
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11px', marginTop: '10px' }}>
        <ShieldCheck size={14} />
        <span>DocTrack Pro is 100% serverless. Your files and data remain locally stored on your machine.</span>
      </div>

    </div>
  );
};
