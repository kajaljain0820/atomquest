import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    include: { changedBy: true },
    take: 50,
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>System Audit Logs</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track all post-lock changes and approvals across the organization.</p>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Timestamp</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Action</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Entity Type</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Changed By</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit logs found yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600,
                      background: log.action === 'APPROVE' ? 'var(--success-bg)' : log.action === 'REJECT' ? 'var(--danger-bg)' : 'var(--primary-glow)',
                      color: log.action === 'APPROVE' ? 'var(--success)' : log.action === 'REJECT' ? 'var(--danger)' : 'var(--primary)',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500, fontSize: '0.875rem' }}>{log.entityType} ({log.entityId.slice(0,8)}...)</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{log.changedBy.name} ({log.changedBy.role})</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
