'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Check, Search, Target, Activity, Award, FileText, Percent, ShieldAlert, Compass } from 'lucide-react';

export default function SharedGoalModal({ isOpen, onClose, employees }: { isOpen: boolean, onClose: () => void, employees: any[] }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    thrustArea: '',
    title: '',
    description: '',
    uomType: 'ZERO_BASED',
    target: '',
    weightage: '10',
    employeeIds: [] as string[]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.employeeIds.length === 0) {
      setError('Please select at least one employee to assign this goal to.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/goals/shared', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target: Number(formData.target),
          weightage: Number(formData.weightage)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign shared goals');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEmployee = (id: string) => {
    setFormData(prev => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(id) 
        ? prev.employeeIds.filter(empId => empId !== id)
        : [...prev.employeeIds, id]
    }));
  };

  const selectAll = () => setFormData(prev => ({ ...prev, employeeIds: employees.map(e => e.id) }));
  const selectNone = () => setFormData(prev => ({ ...prev, employeeIds: [] }));

  const getAvatarGradient = (name: string) => {
    const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
    const index = charCode % 4;
    const gradients = [
      'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
      'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)',
      'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)',
      'linear-gradient(135deg, #34D399 0%, #059669 100%)',
    ];
    return gradients[index];
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return createPortal(
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      width: '100vw', height: '100vh',
      background: 'var(--background)', zIndex: 9999, 
      display: 'flex', flexDirection: 'column', 
      animation: 'fadeIn 0.2s ease-out'
    }}>
      
      {/* Header Bar */}
      <div style={{ 
        padding: '1.5rem 3rem', borderBottom: '1px solid var(--border)', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.625rem', background: 'var(--primary-glow)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
            <Target size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create Shared Goal</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>Cascade a unified target across multiple team members simultaneously with full control.</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          style={{ 
            color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer', 
            padding: '0.5rem', borderRadius: '50%', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={28} />
        </button>
      </div>

      {/* Main Content Pane */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', alignItems: 'start' }}>
            
            {/* Goal Details Form */}
            <form id="sharedGoalForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Goal Parameters</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Define the metrics, target values, and thrust weights for this shared target.</p>
              </div>

              {error && (
                <div style={{ padding: '1rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  <ShieldAlert size={20} />
                  {error}
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={16} style={{ color: 'var(--primary)' }} />
                  Thrust Area
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Operational Excellence, Market Expansion"
                  value={formData.thrustArea} 
                  onChange={(e) => setFormData({...formData, thrustArea: e.target.value})} 
                  onFocus={() => setFocusedField('thrustArea')}
                  onBlur={() => setFocusedField(null)}
                  style={{ 
                    padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${focusedField === 'thrustArea' ? 'var(--primary)' : 'var(--border)'}`, 
                    background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontWeight: 500, fontSize: '0.95rem'
                  }} 
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={16} style={{ color: 'var(--primary)' }} />
                  Goal Title
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Optimize CI/CD build success rate to >95%"
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  style={{ 
                    padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${focusedField === 'title' ? 'var(--primary)' : 'var(--border)'}`, 
                    background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontWeight: 500, fontSize: '0.95rem'
                  }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} style={{ color: 'var(--primary)' }} />
                  Goal Description
                </label>
                <textarea 
                  rows={3} 
                  placeholder="Describe details, success requirements, and critical key results..."
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  style={{ 
                    padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${focusedField === 'description' ? 'var(--primary)' : 'var(--border)'}`, 
                    background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', resize: 'none', fontSize: '0.95rem', fontFamily: 'inherit'
                  }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Compass size={16} style={{ color: 'var(--primary)' }} />
                    UoM Type
                  </label>
                  <select 
                    value={formData.uomType} 
                    onChange={(e) => setFormData({...formData, uomType: e.target.value})} 
                    onFocus={() => setFocusedField('uomType')}
                    onBlur={() => setFocusedField(null)}
                    style={{ 
                      padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${focusedField === 'uomType' ? 'var(--primary)' : 'var(--border)'}`, 
                      background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontWeight: 500, fontSize: '0.95rem'
                    }}
                  >
                    <option value="ZERO_BASED">Zero Based</option>
                    <option value="MIN">Min (Higher is better)</option>
                    <option value="MAX">Max (Lower is better)</option>
                    <option value="TIMELINE">Timeline</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Target Value</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="e.g. 100.00"
                    value={formData.target} 
                    onChange={(e) => setFormData({...formData, target: e.target.value})} 
                    onFocus={() => setFocusedField('target')}
                    onBlur={() => setFocusedField(null)}
                    style={{ 
                      padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${focusedField === 'target' ? 'var(--primary)' : 'var(--border)'}`, 
                      background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontWeight: 600, fontSize: '0.95rem'
                    }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Percent size={16} style={{ color: 'var(--primary)' }} />
                  Weightage (%)
                </label>
                <input 
                  type="number" 
                  min="10" 
                  max="100" 
                  required 
                  placeholder="e.g. 15"
                  value={formData.weightage} 
                  onChange={(e) => setFormData({...formData, weightage: e.target.value})} 
                  onFocus={() => setFocusedField('weightage')}
                  onBlur={() => setFocusedField(null)}
                  style={{ 
                    padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${focusedField === 'weightage' ? 'var(--primary)' : 'var(--border)'}`, 
                    background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontWeight: 600, fontSize: '0.95rem'
                  }} 
                />
              </div>
            </form>

            {/* Employee Selection Column */}
            <div style={{ 
              borderLeft: '1.5px solid var(--border)', paddingLeft: '4rem', 
              display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Cascade Alignment</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Select direct reports to assign this goal sheet parameter to.</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Direct Reports</span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={selectAll} style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 700, border: 'none', background: 'transparent', cursor: 'pointer' }}>Select All</button>
                  <button type="button" onClick={selectNone} style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}>Clear All</button>
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search team members by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setFocusedField('search')}
                  onBlur={() => setFocusedField(null)}
                  style={{ 
                    width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${focusedField === 'search' ? 'var(--primary)' : 'var(--border)'}`, 
                    background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.925rem'
                  }}
                />
              </div>
              
              {/* Employee scrolling list with dynamic height */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {filteredEmployees.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                    No matching direct reports found.
                  </div>
                ) : (
                  filteredEmployees.map(emp => {
                    const isSelected = formData.employeeIds.includes(emp.id);
                    return (
                      <div 
                        key={emp.id} 
                        onClick={() => toggleEmployee(emp.id)}
                        style={{ 
                          padding: '1rem', borderRadius: 'var(--radius-lg)', border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`, 
                          background: isSelected ? 'var(--primary-glow)' : 'var(--surface)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 6px 15px -3px rgba(124, 58, 237, 0.08)' : 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', background: getAvatarGradient(emp.name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.925rem',
                            boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                          }}>
                            {getInitials(emp.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{emp.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                          </div>
                        </div>
                        
                        <div style={{ 
                          width: '24px', height: '24px', borderRadius: '50%', border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}>
                          {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div style={{ 
        padding: '1.5rem 3rem', borderTop: '1px solid var(--border)', 
        display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', 
        background: 'var(--surface)', zIndex: 10
      }}>
        <button 
          type="button" 
          onClick={onClose} 
          style={{ padding: '0.875rem 2rem', fontWeight: 700, color: 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.95rem' }}
        >
          Cancel
        </button>
        
        <button 
          type="submit" 
          form="sharedGoalForm"
          disabled={isSubmitting}
          style={{ 
            padding: '0.875rem 2.5rem', background: 'var(--primary)', color: 'white', fontWeight: 700, borderRadius: 'var(--radius-md)', 
            opacity: isSubmitting ? 0.7 : 1, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            boxShadow: 'var(--shadow-md)', fontSize: '0.95rem'
          }}
          onMouseOver={(e) => { if (!isSubmitting) e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseOut={(e) => { if (!isSubmitting) e.currentTarget.style.filter = 'none'; }}
        >
          {isSubmitting ? 'Assigning Goals...' : `Assign to ${formData.employeeIds.length} Team Members`}
        </button>
      </div>
    </div>,
    document.body
  );
}
