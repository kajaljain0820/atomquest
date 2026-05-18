import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CommentSchema = z.object({
  managerComment: z.string().min(1, "Comment cannot be empty"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validatedData = CommentSchema.parse(body);

    const achievement = await prisma.goalAchievement.findUnique({
      where: { id },
      include: { goal: { include: { goalSheet: { include: { employee: true } } } } }
    });

    if (!achievement) return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
    
    const employee = achievement.goal.goalSheet.employee;
    
    // Authorization: Check if manager is the employee's manager
    if (employee.managerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await prisma.goalAchievement.update({
      where: { id },
      data: {
        managerComment: validatedData.managerComment,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add manager comment" }, { status: 500 });
  }
}
