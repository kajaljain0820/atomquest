import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import CheckInClient from "./CheckInClient";

export default async function ManagerCheckInPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ q?: string }> 
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const quarter = resolvedSearchParams.q || "Q1";

  const sheet = await prisma.goalSheet.findUnique({
    where: { id },
    include: {
      employee: true,
      goals: {
        include: {
          achievements: { where: { quarter } }
        }
      }
    }
  });

  if (!sheet) return notFound();

  // Authorization: Manager must be assigned to this employee (or admin)
  if (sheet.employee.managerId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/dashboard/team");
  }

  if (sheet.status !== "LOCKED") {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Goal Sheet Not Approved</h2>
        <p style={{ color: 'var(--text-muted)' }}>You must approve this employee's goals before conducting quarterly check-ins.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Quarterly Check-in</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Employee: {sheet.employee.name} ({sheet.employee.email})</p>
      </div>

      <CheckInClient sheet={sheet} selectedQuarter={quarter} />
    </div>
  );
}
