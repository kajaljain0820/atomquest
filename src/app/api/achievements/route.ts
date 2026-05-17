import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AchievementSchema = z.object({
  goalId: z.string(),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  actualAchievement: z.number(),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED"]),
  managerComment: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validatedData = AchievementSchema.parse(body);

    const goal = await prisma.goal.findUnique({
      where: { id: validatedData.goalId },
      include: { goalSheet: { include: { employee: true } } },
    });

    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    
    // Authorization: Employee themselves, their Manager, or Admin
    const isEmployee = goal.goalSheet.employeeId === session.user.id;
    const isManager = goal.goalSheet.employee.managerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isEmployee && !isManager && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (goal.goalSheet.status !== "LOCKED") {
      return NextResponse.json({ error: "Can only log achievements for approved and locked goals" }, { status: 400 });
    }

    // Upsert the achievement for this goal and quarter
    const existing = await prisma.goalAchievement.findFirst({
      where: {
        goalId: validatedData.goalId,
        quarter: validatedData.quarter
      }
    });

    const updateData: any = {
      actualAchievement: validatedData.actualAchievement,
      status: validatedData.status,
      loggedAt: new Date()
    };

    if (validatedData.managerComment !== undefined) {
      updateData.managerComment = validatedData.managerComment;
    }

    if (existing) {
      const updated = await prisma.goalAchievement.update({
        where: { id: existing.id },
        data: updateData
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.goalAchievement.create({
        data: {
          ...validatedData,
          loggedAt: new Date()
        }
      });
      return NextResponse.json(created);
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to log achievement" }, { status: 500 });
  }
}

// GET all achievements for the current user's active goal sheet
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const quarter = url.searchParams.get("quarter");

  try {
    const activeSheet = await prisma.goalSheet.findFirst({
      where: { employeeId: session.user.id, status: "LOCKED" },
      include: { 
        goals: {
          include: {
            achievements: quarter ? { where: { quarter } } : true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeSheet) return NextResponse.json({ error: "No locked goal sheet found" }, { status: 404 });

    return NextResponse.json(activeSheet);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}
