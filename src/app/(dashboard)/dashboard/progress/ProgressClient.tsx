'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProgressClient({ sheet, selectedQuarter }: { sheet: any, selectedQuarter: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local state for edits: mapping goal.id -> { actualAchievement, status }
  const [edits, setEdits] = useState<{ [key: string]: { actual: string, status: string } }>(() => {
    const initialState: any = {};
    sheet.goals.forEach((g: any) => {
      const achievement = g.achievements[0];
      initialState[g.id] = {
        actual: achievement ? achievement.actualAchievement.toString() : '',
        status: achievement ? achievement.status : 'NOT_STARTED'
      };
    });
    return initialState;
  });

  const handleUpdate = (goalId: string, field: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value }
    }));
  };

  const calculateScore = (uom: string, target: number, actual: number) => {
    if (isNaN(actual)) return 0;
    if (uom === 'MIN') return Math.min((actual / target) * 100, 100);
    if (uom === 'MAX') return target === 0 ? 0 : Math.min((target / actual) * 100, 100);
    if (uom === 'ZERO_BASED') return actual === 0 ? 100 : 0;
    return 0; // Timeline is harder to quantify generically
  };

  const saveGoalProgress = async (goalId: string) => {
    const data = edits[goalId];
    if (data.actual === '') {
      setError('Please enter an actual achievement value.');
      return;
    }

    setLoading(prev => ({ ...prev, [goalId]: true }));
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          quarter: selectedQuarter,
          actualAchievement: Number(data.actual),
          status: data.status
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }

      setSuccess(`Progress for ${selectedQuarter} saved successfully!`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save progress.');
    } finally {
      setLoading(prev => ({ ...prev, [goalId]: false }));
    }
  };

  return (
    <div>
      {/* Quarter Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
          <button
            key={q}
            onClick={() => router.push(`/dashboard/progress?q=${q}`)}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              background: selectedQuarter === q ? 'var(--primary)' : 'var(--surface)',
              color: selectedQuarter === q ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${selectedQuarter === q ? 'var(--primary)' : 'var(--border)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ padding: '1rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {sheet.goals.map((goal: any) => {
          const editData = edits[goal.id];
          const achievement = goal.achievements[0];
          const score = calculateScore(goal.uomType, goal.target, Number(editData?.actual));

          return (
            <div key={goal.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {goal.thrustArea}
                  </span>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{goal.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{goal.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Weightage</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{goal.weightage}%</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Target ({goal.uomType})</div>
                  <div style={{ fontWeight: 600 }}>{goal.target}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Actual Achievement</div>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editData?.actual || ''} 
                    onChange={(e) => handleUpdate(goal.id, 'actual', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', background: 'var(--background)' }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Status</div>
                  <select 
                    value={editData?.status || 'NOT_STARTED'} 
                    onChange={(e) => handleUpdate(goal.id, 'status', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)' }}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ON_TRACK">On Track</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => saveGoalProgress(goal.id)}
                    disabled={loading[goal.id]}
                    style={{
                      width: '100%', padding: '0.5rem', background: 'var(--primary)', color: 'white', fontWeight: 600, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading[goal.id] ? 0.7 : 1
                    }}
                  >
                    <Save size={16} />
                    {loading[goal.id] ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Progress Bar & Manager Comment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>System Computed Score</span>
                  <span style={{ fontWeight: 600, color: score >= 100 ? 'var(--success)' : 'var(--text-primary)' }}>{score.toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(score, 100)}%`, background: score >= 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {achievement?.managerComment && (
                <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--primary-glow)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>Manager Check-in Comment:</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{achievement.managerComment}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
