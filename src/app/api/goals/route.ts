import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const GoalSchema = z.object({
  goalSheetId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  thrustArea: z.string().min(1),
  uomType: z.enum(["MIN", "MAX", "TIMELINE", "ZERO_BASED"]),
  target: z.number(),
  weightage: z.number().min(10, "Minimum weightage per goal is 10%"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validatedData = GoalSchema.parse(body);

    const sheet = await prisma.goalSheet.findUnique({
      where: { id: validatedData.goalSheetId },
      include: { goals: true },
    });

    if (!sheet) return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    
    // Authorization: User must own the sheet or be an admin
    if (sheet.employeeId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sheet.status === "LOCKED") {
      return NextResponse.json({ error: "Goal sheet is locked" }, { status: 400 });
    }

    if (sheet.goals.length >= 8) {
      return NextResponse.json({ error: "Maximum 8 goals allowed" }, { status: 400 });
    }

    const currentTotalWeightage = sheet.goals.reduce((acc, goal) => acc + goal.weightage, 0);
    if (currentTotalWeightage + validatedData.weightage > 100) {
      return NextResponse.json({ error: "Total weightage cannot exceed 100%" }, { status: 400 });
    }

    const newGoal = await prisma.goal.create({
      data: validatedData,
    });

    return NextResponse.json(newGoal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
