import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      employees: true,
    }
  });

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Welcome back, {user?.name}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Here's what's happening with your goals and performance tracking.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Metric Card 1 */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Current Cycle Status
          </h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Goal Setting Phase
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--success)', marginTop: '0.5rem', fontWeight: 500 }}>
            Open until June 30
          </p>
        </div>

        {/* Metric Card 2 */}
        {user?.role === 'EMPLOYEE' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              My Draft Goals
            </h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>
              0
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Maximum 8 goals allowed
            </p>
          </div>
        )}

        {/* Metric Card 3 */}
        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Team Submissions
            </h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>
              0 / {user?.employees.length || 0}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--warning)', marginTop: '0.5rem', fontWeight: 500 }}>
              0% Completion
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
