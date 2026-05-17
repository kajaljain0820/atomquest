import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    const goalSheets = await prisma.goalSheet.findMany({
      where: { employeeId: userId },
      include: { goals: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goalSheets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch goal sheets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { cycleYear } = await req.json();

  try {
    // Check if a sheet already exists for this cycle
    const existing = await prisma.goalSheet.findFirst({
      where: { employeeId: userId, cycleYear },
    });

    if (existing) {
      return NextResponse.json({ error: "Goal sheet for this cycle already exists", id: existing.id }, { status: 400 });
    }

    const newSheet = await prisma.goalSheet.create({
      data: {
        employeeId: userId,
        cycleYear,
        status: "DRAFT",
      },
    });

    return NextResponse.json(newSheet);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create goal sheet" }, { status: 500 });
  }
}
