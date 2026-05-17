import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProgressClient from "./ProgressClient";

export default async function ProgressPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }> 
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resolvedSearchParams = await searchParams;
  const quarter = resolvedSearchParams.q || "Q1";

  const activeSheet = await prisma.goalSheet.findFirst({
    where: { employeeId: session.user.id, status: "LOCKED" },
    include: {
      goals: {
        include: {
          achievements: { where: { quarter } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Progress Check-ins</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Log your quarterly achievements against your approved goals.</p>
      </div>

      {!activeSheet ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Active Goals</h2>
          <p style={{ color: 'var(--text-muted)' }}>You do not have any locked goals yet. Please wait for your manager to approve your goal sheet.</p>
        </div>
      ) : (
        <ProgressClient sheet={activeSheet} selectedQuarter={quarter} />
      )}
    </div>
  );
}
