import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const whereClause = session.user.role === "ADMIN" ? {} : { managerId: session.user.id };

    const employees = await prisma.user.findMany({
      where: whereClause,
      include: {
        manager: true,
        goalSheets: {
          where: { status: "LOCKED" },
          include: {
            goals: {
              include: { achievements: true }
            }
          }
        }
      }
    });

    // CSV Header
    let csvData = `"Employee Name","Email","Manager","Sheet Status","Thrust Area","Goal Title","UoM","Target","Weightage (%)","Q1 Actual","Q1 Status","Q2 Actual","Q2 Status","Q3 Actual","Q3 Status","Q4 Actual","Q4 Status"\n`;

    // Helper to safely escape CSV fields
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    // Build rows
    employees.forEach(emp => {
      const sheet = emp.goalSheets[0];
      if (!sheet || sheet.goals.length === 0) return;

      sheet.goals.forEach(goal => {
        const getAch = (q: string) => goal.achievements.find(a => a.quarter === q);
        const q1 = getAch("Q1");
        const q2 = getAch("Q2");
        const q3 = getAch("Q3");
        const q4 = getAch("Q4");

        const row = [
          escapeCsv(emp.name),
          escapeCsv(emp.email),
          escapeCsv(emp.manager?.name || 'None'),
          escapeCsv(sheet.status),
          escapeCsv(goal.thrustArea),
          escapeCsv(goal.title),
          escapeCsv(goal.uomType),
          escapeCsv(goal.target),
          escapeCsv(goal.weightage),
          escapeCsv(q1?.actualAchievement ?? ""),
          escapeCsv(q1?.status ?? ""),
          escapeCsv(q2?.actualAchievement ?? ""),
          escapeCsv(q2?.status ?? ""),
          escapeCsv(q3?.actualAchievement ?? ""),
          escapeCsv(q3?.status ?? ""),
          escapeCsv(q4?.actualAchievement ?? ""),
          escapeCsv(q4?.status ?? "")
        ];
        
        csvData += row.join(",") + "\n";
      });
    });

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="achievement_report_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
