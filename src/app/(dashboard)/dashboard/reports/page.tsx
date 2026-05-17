import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  // Fetch all employees if admin, or just managed employees if manager
  const whereClause = session.user.role === "ADMIN" ? {} : { managerId: session.user.id };

  const employees = await prisma.user.findMany({
    where: whereClause,
    include: {
      manager: true,
      goalSheets: {
        where: { cycleYear: "2026-2027" },
        include: {
          goals: {
            include: {
              achievements: true
            }
          }
        }
      }
    }
  });

  const reportData = employees.map(emp => {
    const sheet = emp.goalSheets[0];
    const totalGoals = sheet?.goals.length || 0;
    
    // Calculate completions per quarter
    const getCompletion = (quarter: string) => {
      if (!sheet || totalGoals === 0) return "N/A";
      const completedGoals = sheet.goals.filter(g => 
        g.achievements.some(a => a.quarter === quarter)
      ).length;
      return `${completedGoals}/${totalGoals}`;
    };

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      managerName: emp.manager?.name || "None",
      sheetStatus: sheet?.status || "NOT_CREATED",
      q1: getCompletion("Q1"),
      q2: getCompletion("Q2"),
      q3: getCompletion("Q3"),
      q4: getCompletion("Q4"),
      goals: sheet ? sheet.goals.map(g => ({
        id: g.id,
        title: g.title,
        description: g.description,
        thrustArea: g.thrustArea,
        uomType: g.uomType,
        target: g.target,
        weightage: g.weightage,
        achievements: g.achievements.map(a => ({
          id: a.id,
          quarter: a.quarter,
          actualAchievement: a.actualAchievement,
          status: a.status,
          managerComment: a.managerComment,
          loggedAt: a.loggedAt
        }))
      })) : []
    };
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Completion Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track goal setting and quarterly check-in completion rates across the organization.</p>
      </div>

      <ReportsClient data={reportData} role={session.user.role} />
    </div>
  );
}
