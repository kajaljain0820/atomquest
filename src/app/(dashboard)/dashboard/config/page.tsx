import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Settings, Calendar, Bell } from "lucide-react";

export default async function CycleConfigPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cycle Configuration</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage appraisal cycles, deadlines, and global system settings.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Active Cycle Panel */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <Calendar color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Active Appraisal Cycle</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Current Cycle Name</span>
              <span style={{ fontWeight: 600, padding: '0.25rem 0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
                FY 2026-2027
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Goal Setting Lock Date</span>
              <span style={{ fontWeight: 600 }}>May 31, 2026</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Q1 Check-in Deadline</span>
              <span style={{ fontWeight: 600 }}>July 15, 2026</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Cycle Status</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>Active / Open</span>
            </div>
          </div>

          <button style={{ 
            marginTop: 'auto', padding: '0.75rem', background: 'var(--surface-hover)', 
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', 
            fontWeight: 600, color: 'var(--text-primary)', cursor: 'not-allowed', opacity: 0.7 
          }}>
            Edit Cycle Dates (Demo Only)
          </button>
        </div>

        {/* Global Settings Panel */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <Settings color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Global Rules</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Minimum Goal Weightage</span>
              <span style={{ fontWeight: 600 }}>10%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Required Total Weightage</span>
              <span style={{ fontWeight: 600 }}>100%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Allow Employee Post-Lock Edits</span>
              <span style={{ fontWeight: 600, color: 'var(--danger)' }}>Disabled</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Manager Check-in Comments</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>Mandatory</span>
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', color: 'var(--warning)' }}>
            <Bell size={20} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.875rem' }}>System rules are hardcoded for this evaluation cycle to enforce strict governance compliance.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
