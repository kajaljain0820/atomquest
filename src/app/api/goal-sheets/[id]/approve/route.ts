import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: { employee: true }
    });

    if (!sheet) return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    
    // Authorization: Check if manager is the employee's manager
    if (sheet.employee.managerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sheet.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Can only approve submitted sheets" }, { status: 400 });
    }

    const updatedSheet = await prisma.goalSheet.update({
      where: { id },
      data: { status: "LOCKED", lockedAt: new Date() },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        entityId: sheet.id,
        entityType: "GOAL_SHEET",
        action: "APPROVE",
        changedById: session.user.id,
      }
    });

    return NextResponse.json(updatedSheet);
  } catch (error) {
    return NextResponse.json({ error: "Failed to approve goal sheet" }, { status: 500 });
  }
}
