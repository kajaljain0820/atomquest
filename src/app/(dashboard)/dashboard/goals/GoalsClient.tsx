'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Send, AlertCircle } from 'lucide-react';

export default function GoalsClient({ sheet }: { sheet: any }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalWeightage = sheet.goals.reduce((acc: number, g: any) => acc + g.weightage, 0);
  const isDraft = sheet.status === 'DRAFT' || sheet.status === 'RETURNED';

  const handleSubmitSheet = async () => {
    if (totalWeightage !== 100) {
      setError('Total weightage must be exactly 100% to submit.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await fetch(`/api/goal-sheets/${sheet.id}/submit`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to submit goal sheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            background: `conic-gradient(var(--primary) ${totalWeightage}%, var(--border) 0)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: 700
          }}>
            <div style={{ width: '50px', height: '50px', background: 'var(--background)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {totalWeightage}%
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Weightage Allocation</h3>
            <p style={{ fontSize: '0.875rem', color: totalWeightage > 100 ? 'var(--danger)' : 'var(--text-secondary)' }}>
              {totalWeightage}/100% Allocated
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isDraft && (
            <>
              <button 
                onClick={() => setIsModalOpen(true)}
                disabled={sheet.goals.length >= 8}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontWeight: 600, cursor: sheet.goals.length >= 8 ? 'not-allowed' : 'pointer',
                  opacity: sheet.goals.length >= 8 ? 0.5 : 1
                }}
              >
                <Plus size={18} />
                Add Goal
              </button>
              
              <button 
                onClick={handleSubmitSheet}
                disabled={isSubmitting || totalWeightage !== 100}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--primary)', color: 'white', fontWeight: 600,
                  cursor: (isSubmitting || totalWeightage !== 100) ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitting || totalWeightage !== 100) ? 0.7 : 1
                }}
              >
                <Send size={18} />
                {isSubmitting ? 'Submitting...' : 'Submit Sheet'}
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
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Weightage</th>
            </tr>
          </thead>
          <tbody>
            {sheet.goals.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No goals added yet. Start by clicking "Add Goal".
                </td>
              </tr>
            ) : (
              sheet.goals.map((goal: any) => (
                <tr key={goal.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{goal.thrustArea}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 500 }}>{goal.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{goal.description}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{goal.uomType}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{goal.target}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      background: 'var(--primary-glow)', 
                      color: 'var(--primary)', 
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      {goal.weightage}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <GoalFormModal 
          sheetId={sheet.id} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); router.refresh(); }} 
        />
      )}
    </div>
  );
}

function GoalFormModal({ sheetId, onClose, onSuccess }: { sheetId: string, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thrustArea: '',
    uomType: 'MIN',
    target: '',
    weightage: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalSheetId: sheetId,
          ...formData,
          target: Number(formData.target),
          weightage: Number(formData.weightage)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--surface)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add New Goal</h2>
        
        {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Thrust Area</label>
            <input required type="text" value={formData.thrustArea} onChange={e => setFormData({...formData, thrustArea: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Title</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} rows={2} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>UoM Type</label>
              <select value={formData.uomType} onChange={e => setFormData({...formData, uomType: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}>
                <option value="MIN">Min (Higher is better)</option>
                <option value="MAX">Max (Lower is better)</option>
                <option value="TIMELINE">Timeline</option>
                <option value="ZERO_BASED">Zero-based</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Target</label>
              <input required type="number" step="0.01" value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Weightage (%)</label>
            <input required type="number" min="10" max="100" value={formData.weightage} onChange={e => setFormData({...formData, weightage: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Min 10% per goal. Must total 100%.</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: 'var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Adding...' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
