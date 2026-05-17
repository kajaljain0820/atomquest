import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const EditGoalsSchema = z.array(z.object({
  id: z.string(),
  target: z.number(),
  weightage: z.number().min(10, "Minimum weightage per goal is 10%"),
}));

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validatedData = EditGoalsSchema.parse(body);

    const sheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: { employee: true, goals: true },
    });

    if (!sheet) return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    
    // Authorization: Check if manager is the employee's manager
    if (sheet.employee.managerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sheet.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Can only edit submitted sheets" }, { status: 400 });
    }

    // Validate total weightage
    const totalWeightage = validatedData.reduce((acc, goal) => acc + goal.weightage, 0);
    if (totalWeightage !== 100) {
      return NextResponse.json({ error: `Total weightage must be exactly 100%. Current: ${totalWeightage}%` }, { status: 400 });
    }

    // Verify all goals belong to the sheet
    const sheetGoalIds = sheet.goals.map((g) => g.id);
    const hasInvalidIds = validatedData.some((g) => !sheetGoalIds.includes(g.id));
    if (hasInvalidIds) {
      return NextResponse.json({ error: "Invalid goal IDs provided" }, { status: 400 });
    }

    // Update goals in a transaction
    await prisma.$transaction(
      validatedData.map((goalUpdate) =>
        prisma.goal.update({
          where: { id: goalUpdate.id },
          data: {
            target: goalUpdate.target,
            weightage: goalUpdate.weightage,
          },
        })
      )
    );

    return NextResponse.json({ message: "Goals updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update goals" }, { status: 500 });
  }
}
