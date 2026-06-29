import React from 'react';
import { Award, Lock, CheckCircle2, Moon, Sun, Crown, Grid, Binary, Flame, FilePlus2 } from 'lucide-react';
import type { AchievementBadge } from '../types';

interface AchievementsProps {
  badges: AchievementBadge[];
}

export const Achievements: React.FC<AchievementsProps> = ({ badges }) => {
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const progressPercent = Math.round((unlockedCount / badges.length) * 100);

  const getIcon = (iconName: string, size: number = 24) => {
    switch (iconName) {
      case 'FilePlus': return <FilePlus2 size={size} />;
      case 'Flame': return <Flame size={size} />;
      case 'Sun': return <Sun size={size} />;
      case 'Moon': return <Moon size={size} />;
      case 'Crown': return <Crown size={size} />;
      case 'Binary': return <Binary size={size} />;
      case 'Grid': return <Grid size={size} />;
      default: return <Award size={size} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Overview stats header */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={28} style={{ color: 'var(--accent)' }} /> 
            Productivity Milestones
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Unlock achievements by tracking consistency, updating spreadsheets, and completing daily studies!
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '220px' }}>
          <div style={{ flexGrow: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>Unlocked Badges</span>
              <strong>{unlockedCount} / {badges.length}</strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {badges.map((badge) => {
          return (
            <div 
              key={badge.id}
              className={`glass-card badge-card ${badge.unlocked ? 'unlocked animate-slide-in' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                position: 'relative',
                overflow: 'hidden',
                background: badge.unlocked ? 'rgba(var(--accent-rgb), 0.02)' : 'var(--glass-bg)'
              }}
            >
              {/* Badge Glow Overlay */}
              {badge.unlocked && (
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  filter: 'blur(30px)',
                  opacity: 0.2
                }} />
              )}

              <div className="badge-icon-wrap" style={{ flexShrink: 0 }}>
                {badge.unlocked ? getIcon(badge.icon, 24) : <Lock size={22} />}
              </div>

              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <h4 style={{ 
                  fontSize: '15px', 
                  color: badge.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {badge.title}
                  {badge.unlocked && <CheckCircle2 size={13} style={{ color: 'var(--accent)' }} />}
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineBreak: 'anywhere' }}>
                  {badge.description}
                </p>
                {badge.unlocked && badge.unlockedAt && (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Unlocked: {new Date(badge.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
