'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle, CheckCircle2, MessageSquare, Award } from 'lucide-react';

export default function CheckInClient({ sheet, selectedQuarter }: { sheet: any, selectedQuarter: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local state for goals progress and manager comments
  const [edits, setEdits] = useState<{ [key: string]: { actual: string, status: string, comment: string } }>(() => {
    const initialState: any = {};
    sheet.goals.forEach((g: any) => {
      const achievement = g.achievements[0];
      initialState[g.id] = {
        actual: achievement ? achievement.actualAchievement.toString() : '',
        status: achievement ? achievement.status : 'NOT_STARTED',
        comment: achievement ? (achievement.managerComment || '') : ''
      };
    });
    return initialState;
  });

  const handleUpdate = (goalId: string, field: 'actual' | 'status' | 'comment', value: string) => {
    setEdits(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value
      }
    }));
  };

  const calculateScore = (uom: string, target: number, actual: number) => {
    if (isNaN(actual)) return 0;
    if (uom === 'MIN') return Math.min((actual / target) * 100, 100);
    if (uom === 'MAX') return target === 0 ? 0 : Math.min((target / actual) * 100, 100);
    if (uom === 'ZERO_BASED') return actual === 0 ? 100 : 0;
    return 0; 
  };

  const saveCheckIn = async (goalId: string) => {
    const goalData = edits[goalId];
    if (goalData.actual === '' || isNaN(Number(goalData.actual))) {
      setError('Please enter a valid numeric actual achievement.');
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
          actualAchievement: Number(goalData.actual),
          status: goalData.status,
          managerComment: goalData.comment
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }

      setSuccess(`Check-in for ${selectedQuarter} saved successfully!`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save check-in.');
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
            onClick={() => router.push(`/dashboard/team/${sheet.id}/check-in?q=${q}`)}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              background: selectedQuarter === q ? 'var(--primary)' : 'var(--surface)',
              color: selectedQuarter === q ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${selectedQuarter === q ? 'var(--primary)' : 'var(--border)'}`,
              transition: 'all 0.2s ease',
              cursor: 'pointer'
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
          const currentEdit = edits[goal.id] || { actual: '', status: 'NOT_STARTED', comment: '' };
          const actualValue = parseFloat(currentEdit.actual) || 0;
          const score = calculateScore(goal.uomType, goal.target, actualValue);

          return (
            <div key={goal.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.125rem' }}>{goal.weightage}%</div>
                </div>
              </div>

              {/* Progress Log Inputs for Manager */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'var(--surface-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', alignItems: 'end' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Target ({goal.uomType})</div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', padding: '0.5rem 0' }}>{goal.target}</div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Actual Achievement</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Enter actual..."
                    value={currentEdit.actual} 
                    onChange={(e) => handleUpdate(goal.id, 'actual', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
                  <select 
                    value={currentEdit.status} 
                    onChange={(e) => handleUpdate(goal.id, 'status', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--text-primary)', fontWeight: 500 }}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ON_TRACK">On Track</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>System Score</div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Award size={16} />
                    {score.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Manager Comment Box */}
              <div style={{ marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  <MessageSquare size={16} />
                  Manager Check-in Feedback
                </label>
                <textarea 
                  value={currentEdit.comment}
                  onChange={(e) => handleUpdate(goal.id, 'comment', e.target.value)}
                  placeholder="Add structured manager feedback/check-in comment..."
                  rows={2}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--background)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                  <button 
                    onClick={() => saveCheckIn(goal.id)}
                    disabled={loading[goal.id]}
                    style={{
                      padding: '0.625rem 1.75rem', background: 'var(--primary)', color: 'white', fontWeight: 600, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: loading[goal.id] ? 0.7 : 1, border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <Save size={16} />
                    {loading[goal.id] ? 'Saving...' : 'Save Check-in'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
