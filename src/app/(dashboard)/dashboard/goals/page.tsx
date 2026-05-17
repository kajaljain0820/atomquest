import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import GoalsClient from "./GoalsClient";

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  let sheet = await prisma.goalSheet.findFirst({
    where: { employeeId: session.user.id, cycleYear: "2026-2027" },
    include: { goals: true },
  });

  // Automatically create a draft if none exists for demo purposes
  if (!sheet && (session.user.role === 'EMPLOYEE' || session.user.role === 'MANAGER')) {
    sheet = await prisma.goalSheet.create({
      data: {
        employeeId: session.user.id,
        cycleYear: "2026-2027",
        status: "DRAFT",
      },
      include: { goals: true },
    });
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Goals</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Cycle: 2026-2027</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {sheet && (
            <span style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '0.875rem', 
              fontWeight: 600,
              backgroundColor: sheet.status === 'LOCKED' ? 'var(--success-bg)' : 
                             sheet.status === 'DRAFT' ? 'var(--warning-bg)' : 'var(--primary-glow)',
              color: sheet.status === 'LOCKED' ? 'var(--success)' : 
                     sheet.status === 'DRAFT' ? 'var(--warning)' : 'var(--primary)',
            }}>
              {sheet.status}
            </span>
          )}
        </div>
      </div>

      {sheet ? (
        <GoalsClient sheet={sheet} />
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No active goal sheet found.</p>
        </div>
      )}
    </div>
  );
}
