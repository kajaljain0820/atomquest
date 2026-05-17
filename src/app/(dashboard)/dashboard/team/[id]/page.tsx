import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ReviewClient from "./ReviewClient";

export default async function GoalSheetReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id },
    include: {
      goals: true,
      employee: true,
    }
  });

  if (!sheet) return notFound();

  if (sheet.employee.managerId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/dashboard/team");
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Review Goal Sheet</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Employee: {sheet.employee.name} ({sheet.employee.email})</p>
      </div>

      <ReviewClient sheet={sheet} userRole={session.user.role} />
    </div>
  );
}
