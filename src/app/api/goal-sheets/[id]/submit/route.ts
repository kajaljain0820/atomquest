import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: { goals: true },
    });

    if (!sheet) return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    
    if (sheet.employeeId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sheet.status !== "DRAFT" && sheet.status !== "RETURNED") {
      return NextResponse.json({ error: "Can only submit drafts" }, { status: 400 });
    }

    const totalWeightage = sheet.goals.reduce((acc, goal) => acc + goal.weightage, 0);
    if (totalWeightage !== 100) {
      return NextResponse.json({ error: `Total weightage must be exactly 100%. Current: ${totalWeightage}%` }, { status: 400 });
    }

    const hasInvalidWeightage = sheet.goals.some((goal) => goal.weightage < 10);
    if (hasInvalidWeightage) {
      return NextResponse.json({ error: "Each goal must have a minimum weightage of 10%" }, { status: 400 });
    }

    const updatedSheet = await prisma.goalSheet.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });

    return NextResponse.json(updatedSheet);
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to submit goal sheet" }, { status: 500 });
  }
}
