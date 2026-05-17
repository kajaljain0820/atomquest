import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding dummy data...');

  const emp1 = await prisma.user.findUnique({ where: { email: 'employee@goalforge.com' } });
  const emp2 = await prisma.user.findUnique({ where: { email: 'employee2@goalforge.com' } });
  const manager = await prisma.user.findUnique({ where: { email: 'manager@goalforge.com' } });

  if (!emp1 || !emp2 || !manager) {
    console.log('Core users not found. Run standard seed first.');
    return;
  }

  // Emp1: Locked Goal Sheet with Progress
  const sheet1 = await prisma.goalSheet.upsert({
    where: { id: 'dummy-sheet-1' },
    update: { status: 'LOCKED' },
    create: {
      id: 'dummy-sheet-1',
      employeeId: emp1.id,
      cycleYear: '2026-2027',
      status: 'LOCKED',
    }
  });

  // Goals for Emp1
  const goal1 = await prisma.goal.upsert({
    where: { id: 'emp1-goal-1' },
    update: {},
    create: {
      id: 'emp1-goal-1',
      goalSheetId: sheet1.id,
      thrustArea: 'Revenue Growth',
      title: 'Increase Q3 Sales by 15%',
      description: 'Focus on enterprise clients in the NA region',
      uomType: 'ZERO_BASED',
      target: 15,
      weightage: 50,
    }
  });

  const goal2 = await prisma.goal.upsert({
    where: { id: 'emp1-goal-2' },
    update: {},
    create: {
      id: 'emp1-goal-2',
      goalSheetId: sheet1.id,
      thrustArea: 'Customer Success',
      title: 'Maintain 98% CSAT Score',
      description: 'Ensure prompt responses and issue resolution',
      uomType: 'MIN',
      target: 98,
      weightage: 50,
    }
  });

  // Achievements for Emp1
  await prisma.goalAchievement.upsert({
    where: { id: 'emp1-goal1-q1' },
    update: {},
    create: {
      id: 'emp1-goal1-q1',
      goalId: goal1.id,
      quarter: 'Q1',
      actualAchievement: 10,
      status: 'ON_TRACK',
      managerComment: 'Great start! Keep pushing for the 15% mark.',
    }
  });

  await prisma.goalAchievement.upsert({
    where: { id: 'emp1-goal1-q2' },
    update: {},
    create: {
      id: 'emp1-goal1-q2',
      goalId: goal1.id,
      quarter: 'Q2',
      actualAchievement: 16,
      status: 'COMPLETED',
      managerComment: 'Fantastic work exceeding the goal early!',
    }
  });

  await prisma.goalAchievement.upsert({
    where: { id: 'emp1-goal2-q1' },
    update: {},
    create: {
      id: 'emp1-goal2-q1',
      goalId: goal2.id,
      quarter: 'Q1',
      actualAchievement: 99,
      status: 'ON_TRACK',
      managerComment: 'Perfect score, well done.',
    }
  });

  // Emp2: Submitted Goal Sheet (Waiting for Manager Review)
  const sheet2 = await prisma.goalSheet.upsert({
    where: { id: 'dummy-sheet-2' },
    update: { status: 'SUBMITTED' },
    create: {
      id: 'dummy-sheet-2',
      employeeId: emp2.id,
      cycleYear: '2026-2027',
      status: 'SUBMITTED',
    }
  });

  // Goals for Emp2
  await prisma.goal.upsert({
    where: { id: 'emp2-goal-1' },
    update: {},
    create: {
      id: 'emp2-goal-1',
      goalSheetId: sheet2.id,
      thrustArea: 'Product Development',
      title: 'Ship Phase 4 Features',
      description: 'Deliver the reporting dashboards and export endpoints',
      uomType: 'TIMELINE',
      target: 100,
      weightage: 60,
    }
  });

  await prisma.goal.upsert({
    where: { id: 'emp2-goal-2' },
    update: {},
    create: {
      id: 'emp2-goal-2',
      goalSheetId: sheet2.id,
      thrustArea: 'Engineering Quality',
      title: 'Reduce Bug Count by 20%',
      description: 'Implement stricter PR reviews',
      uomType: 'MAX',
      target: 20,
      weightage: 40,
    }
  });

  console.log('Dummy data injected successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
