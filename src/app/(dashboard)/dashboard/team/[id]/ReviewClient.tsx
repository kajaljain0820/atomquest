'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, AlertCircle, Edit2, Save } from 'lucide-react';

export default function ReviewClient({ sheet, userRole }: { sheet: any, userRole?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoals, setEditedGoals] = useState<{id: string, target: number, weightage: number}[]>([]);

  useEffect(() => {
    setEditedGoals(sheet.goals.map((g: any) => ({ id: g.id, target: g.target, weightage: g.weightage })));
  }, [sheet.goals]);

  const currentGoals = isEditing ? editedGoals : sheet.goals;
  const totalWeightage = currentGoals.reduce((acc: number, g: any) => acc + g.weightage, 0);
  const canAction = sheet.status === 'SUBMITTED';

  const handleAction = async (action: 'approve' | 'return' | 'unlock') => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await fetch(`/api/goal-sheets/${sheet.id}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      router.refresh();
      if (action === 'unlock') {
        // Stay on page after unlock
      } else {
        router.push('/dashboard/team');
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${action} goal sheet`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (totalWeightage !== 100) {
      setError("Total weightage must equal exactly 100%.");
      return;
    }

    if (editedGoals.some(g => g.weightage < 10)) {
      setError("Each goal must have a minimum weightage of 10%.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/goal-sheets/${sheet.id}/edit-goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedGoals)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save edits.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateGoal = (id: string, field: 'target' | 'weightage', value: number) => {
    setEditedGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <span style={{ 
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: 600,
              background: sheet.status === 'LOCKED' ? 'var(--success-bg)' : sheet.status === 'DRAFT' || sheet.status === 'RETURNED' ? 'var(--warning-bg)' : 'var(--primary-glow)',
              color: sheet.status === 'LOCKED' ? 'var(--success)' : sheet.status === 'DRAFT' || sheet.status === 'RETURNED' ? 'var(--warning)' : 'var(--primary)',
            }}>
              Status: {sheet.status}
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: totalWeightage !== 100 && isEditing ? 'var(--danger)' : 'inherit' }}>
              Total Weightage: {totalWeightage}%
            </h3>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Admin Unlock Feature */}
          {sheet.status === 'LOCKED' && userRole === 'ADMIN' && (
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to unlock this sheet? This will be logged.")) {
                  handleAction('unlock');
                }
              }}
              disabled={isSubmitting}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                background: 'var(--warning)', color: 'white', fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <AlertCircle size={18} />
              Admin: Unlock Sheet
            </button>
          )}

          {canAction && !isEditing && (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                disabled={isSubmitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1
                }}
              >
                <Edit2 size={18} />
                Edit Inline
              </button>

              <button 
                onClick={() => handleAction('return')}
                disabled={isSubmitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1
                }}
              >
                <X size={18} />
                Return for Rework
              </button>
              
              <button 
                onClick={() => handleAction('approve')}
                disabled={isSubmitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--success)', color: 'white', fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                <Check size={18} />
                Approve & Lock
              </button>
            </>
          )}

          {canAction && isEditing && (
            <>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditedGoals(sheet.goals.map((g: any) => ({ id: g.id, target: g.target, weightage: g.weightage })));
                  setError('');
                }}
                disabled={isSubmitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges}
                disabled={isSubmitting || totalWeightage !== 100}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--primary)', color: 'white', fontWeight: 600,
                  cursor: (isSubmitting || totalWeightage !== 100) ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitting || totalWeightage !== 100) ? 0.7 : 1
                }}
              >
                <Save size={18} />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Goals Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Thrust Area</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Title</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>UoM</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Target</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Weightage (%)</th>
            </tr>
          </thead>
          <tbody>
            {sheet.goals.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No goals found.
                </td>
              </tr>
            ) : (
              sheet.goals.map((goal: any) => {
                const editedGoal = editedGoals.find(g => g.id === goal.id);
                const targetValue = editedGoal ? editedGoal.target : goal.target;
                const weightageValue = editedGoal ? editedGoal.weightage : goal.weightage;

                return (
                  <tr key={goal.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{goal.thrustArea}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 500 }}>{goal.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{goal.description}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{goal.uomType}</td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                      {isEditing ? (
                        <input 
                          type="number" 
                          step="0.01"
                          value={targetValue} 
                          onChange={(e) => updateGoal(goal.id, 'target', Number(e.target.value))}
                          style={{ width: '80px', padding: '0.25rem', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)' }}
                        />
                      ) : (
                        targetValue
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {isEditing ? (
                        <input 
                          type="number" 
                          min="10"
                          max="100"
                          value={weightageValue} 
                          onChange={(e) => updateGoal(goal.id, 'weightage', Number(e.target.value))}
                          style={{ width: '80px', padding: '0.25rem', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)' }}
                        />
                      ) : (
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          background: 'var(--primary-glow)', 
                          color: 'var(--primary)', 
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }}>
                          {weightageValue}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
