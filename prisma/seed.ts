import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding core roles with secure bcrypt hashing...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const managerPassword = await bcrypt.hash('manager123', 10)
  const employeePassword = await bcrypt.hash('employee123', 10)

  // Create Admins
  const admin = await prisma.user.upsert({
    where: { email: 'admin@goalforge.com' },
    update: {
      password: adminPassword,
    },
    create: {
      email: 'admin@goalforge.com',
      password: adminPassword,
      name: 'Super Admin',
      role: 'ADMIN',
    },
  })

  // Create Managers
  const manager1 = await prisma.user.upsert({
    where: { email: 'manager@goalforge.com' },
    update: {
      password: managerPassword,
    },
    create: {
      email: 'manager@goalforge.com',
      password: managerPassword,
      name: 'Sarah Connor',
      role: 'MANAGER',
    },
  })

  // Create Employees
  const emp1 = await prisma.user.upsert({
    where: { email: 'employee@goalforge.com' },
    update: {
      password: employeePassword,
      managerId: manager1.id,
    },
    create: {
      email: 'employee@goalforge.com',
      password: employeePassword,
      name: 'John Doe',
      role: 'EMPLOYEE',
      managerId: manager1.id,
    },
  })

  const emp2 = await prisma.user.upsert({
    where: { email: 'employee2@goalforge.com' },
    update: {
      password: employeePassword,
      managerId: manager1.id,
    },
    create: {
      email: 'employee2@goalforge.com',
      password: employeePassword,
      name: 'Jane Smith',
      role: 'EMPLOYEE',
      managerId: manager1.id,
    },
  })

  // Create Cycle Windows
  const cycles = [
    { period: 'SETTING', openDate: new Date('2026-05-01T00:00:00Z'), closeDate: new Date('2026-06-30T23:59:59Z') },
    { period: 'Q1', openDate: new Date('2026-07-01T00:00:00Z'), closeDate: new Date('2026-07-31T23:59:59Z') },
    { period: 'Q2', openDate: new Date('2026-10-01T00:00:00Z'), closeDate: new Date('2026-10-31T23:59:59Z') },
    { period: 'Q3', openDate: new Date('2027-01-01T00:00:00Z'), closeDate: new Date('2027-01-31T23:59:59Z') },
    { period: 'Q4', openDate: new Date('2027-03-01T00:00:00Z'), closeDate: new Date('2027-04-30T23:59:59Z') },
  ]

  for (const cycle of cycles) {
    await prisma.cycleWindow.upsert({
      where: { period: cycle.period },
      update: { openDate: cycle.openDate, closeDate: cycle.closeDate },
      create: cycle,
    })
  }

  console.log('Seed completed successfully.')
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
