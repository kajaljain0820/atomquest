import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TeamActions from "./TeamActions";

export default async function TeamReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  if (session.user.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const whereClause = session.user.role === "ADMIN" ? {} : { managerId: session.user.id };

  const employees = await prisma.user.findMany({
    where: whereClause,
    include: {
      manager: true,
      goalSheets: {
        where: { cycleYear: "2026-2027" },
        include: { goals: true }
      }
    }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Team Review</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your team's goals and check-ins.</p>
        </div>
        <div>
          <TeamActions employees={employees} />
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Employee</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Goals</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No team members found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const sheet = emp.goalSheets[0];
                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{emp.name}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{emp.email}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {!sheet ? (
                        <span style={{ padding: '0.25rem 0.5rem', background: 'var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>Not Started</span>
                      ) : (
                        <span style={{ 
                          padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600,
                          background: sheet.status === 'LOCKED' ? 'var(--success-bg)' : sheet.status === 'DRAFT' ? 'var(--warning-bg)' : 'var(--primary-glow)',
                          color: sheet.status === 'LOCKED' ? 'var(--success)' : sheet.status === 'DRAFT' ? 'var(--warning)' : 'var(--primary)'
                        }}>
                          {sheet.status}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                      {sheet?.goals.length || 0}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {sheet && sheet.status !== 'DRAFT' && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <Link 
                            href={`/dashboard/team/${sheet.id}`}
                            style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem' }}
                          >
                            Review
                          </Link>
                          {sheet.status === 'LOCKED' && (
                            <Link 
                              href={`/dashboard/team/${sheet.id}/check-in`}
                              style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.875rem' }}
                            >
                              Check-ins
                            </Link>
                          )}
                        </div>
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
