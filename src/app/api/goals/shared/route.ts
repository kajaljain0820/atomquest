import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SharedGoalSchema = z.object({
  thrustArea: z.string().min(1, "Thrust Area is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  uomType: z.enum(["MIN", "MAX", "TIMELINE", "ZERO_BASED"]),
  target: z.number().min(0, "Target must be positive"),
  weightage: z.number().min(10, "Minimum weightage is 10%").max(100),
  employeeIds: z.array(z.string()).min(1, "Select at least one employee")
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = SharedGoalSchema.parse(body);

    const { employeeIds, ...goalData } = validatedData;

    // Validate that the manager actually manages these employees
    const employees = await prisma.user.findMany({
      where: {
        id: { in: employeeIds },
        managerId: session.user.role === "MANAGER" ? session.user.id : undefined // Admin can assign to anyone
      }
    });

    if (employees.length !== employeeIds.length) {
      return NextResponse.json({ error: "One or more selected employees are invalid or not managed by you." }, { status: 400 });
    }

    const createdGoals = [];

    // Process sequentially to handle sheet creation/updates safely
    for (const emp of employees) {
      // Find active sheet
      let sheet = await prisma.goalSheet.findFirst({
        where: { employeeId: emp.id, cycleYear: "2026-2027" }
      });

      // If no sheet, create a draft one
      if (!sheet) {
        sheet = await prisma.goalSheet.create({
          data: {
            employeeId: emp.id,
            cycleYear: "2026-2027",
            status: "DRAFT"
          }
        });
      } else {
        // If sheet exists and is NOT draft, revert it to DRAFT because adding a goal invalidates the 100% weightage
        if (sheet.status !== "DRAFT") {
          sheet = await prisma.goalSheet.update({
            where: { id: sheet.id },
            data: { status: "DRAFT" }
          });
          
          // Log the reversion if it was locked
          await prisma.auditLog.create({
            data: {
              entityId: sheet.id,
              entityType: "GOAL_SHEET",
              action: "REVERTED_TO_DRAFT_SHARED_GOAL",
              changedById: session.user.id,
            }
          });
        }
      }

      // Create the goal
      const goal = await prisma.goal.create({
        data: {
          ...goalData,
          goalSheetId: sheet.id,
        }
      });
      createdGoals.push(goal);
    }

    return NextResponse.json({ message: "Shared goals assigned successfully", count: createdGoals.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to assign shared goals" }, { status: 500 });
  }
}
