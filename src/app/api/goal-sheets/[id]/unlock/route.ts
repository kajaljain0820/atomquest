import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  // Strict Governance: ONLY Admins can unlock sheets
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin intervention required." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id }
    });

    if (!sheet) return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    
    if (sheet.status !== "LOCKED") {
      return NextResponse.json({ error: "Can only unlock locked sheets" }, { status: 400 });
    }

    const updatedSheet = await prisma.goalSheet.update({
      where: { id },
      data: { status: "RETURNED" }, // Return it to draft/rework state so changes can be made
    });

    // Create Strict Audit Log
    await prisma.auditLog.create({
      data: {
        entityId: sheet.id,
        entityType: "GOAL_SHEET",
        action: "UNLOCK", // Critical governance logging
        changedById: session.user.id,
      }
    });

    return NextResponse.json(updatedSheet);
  } catch (error) {
    return NextResponse.json({ error: "Failed to unlock goal sheet" }, { status: 500 });
  }
}
