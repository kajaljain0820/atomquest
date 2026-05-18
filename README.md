<div align="center">

# ⚡ AtomQuest Goal Tracking Portal

### *Align Goals. Track Progress. Drive Success.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

A full-stack enterprise **Goal Setting & Performance Tracking** platform built for the AtomQuest Hackathon. Digitizes the complete employee performance lifecycle — from goal creation and manager approvals to quarterly check-ins and executive reporting.

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Goal Sheet Lifecycle](#-goal-sheet-lifecycle)
- [Business Rules & Validation](#-business-rules--validation)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Demo Credentials](#-demo-credentials)
- [API Reference](#-api-reference)
- [Deployment](#-deployment-vercel)
- [Security](#-security)

---

## 🔭 Overview

AtomQuest Goal Tracking Portal is a role-based web application that enables organizations to manage the full performance management cycle:

- Employees define their goals and submit them for approval
- Managers review, edit, and approve or return goal sheets
- Achievements are logged every quarter (Q1–Q4) against approved goals
- Admins govern the entire system — user hierarchy, cycle configuration, and audit trails
- Reports can be exported as **PDF** or **Excel** for HR and leadership reviews

---

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

### 👤 Employee
- Create & manage goals per cycle year
- Set targets, weightage & UoM type
- Submit goals for manager approval
- Log quarterly achievements (Q1–Q4)
- Track completion status in real-time

</td>
<td width="33%" valign="top">

### 👔 Manager
- Review & approve/return goal sheets
- Edit targets & weightages inline
- Assign shared goals to entire team
- Add structured comments on achievements
- Monitor team progress via dashboard

</td>
<td width="33%" valign="top">

### 🛡️ Admin / HR
- Manage users & reporting hierarchy
- Configure goal cycle windows
- Unlock locked sheets for edits
- View complete system audit logs
- Export PDF & Excel reports

</td>
</tr>
</table>

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | MySQL 8 |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js (JWT + Credentials) |
| **Password Hashing** | bcryptjs |
| **Validation** | Zod |
| **PDF Export** | jsPDF |
| **Excel Export** | ExcelJS |
| **Deployment** | Vercel |

---

## 🗄️ Database Schema

```
┌──────────────────────────────────────────────────────────────┐
│  User                                                        │
│  id · email · password · name · role · msEntraId · managerId │
└──────────────────┬───────────────────────────────────────────┘
                   │ 1:N
┌──────────────────▼───────────────────────────────────────────┐
│  GoalSheet                                                   │
│  id · employeeId · cycleYear · status · createdAt · lockedAt │
└──────────────────┬───────────────────────────────────────────┘
                   │ 1:N
┌──────────────────▼───────────────────────────────────────────┐
│  Goal                                                        │
│  id · goalSheetId · title · description · thrustArea        │
│  uomType · target · weightage · isShared · parentGoalId      │
└──────────────────┬───────────────────────────────────────────┘
                   │ 1:N
┌──────────────────▼───────────────────────────────────────────┐
│  GoalAchievement                                             │
│  id · goalId · quarter · actualAchievement                   │
│  status · managerComment · loggedAt                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  AuditLog                                                    │
│  id · entityId · entityType · action                         │
│  oldValues · newValues · changedById · timestamp             │
├──────────────────────────────────────────────────────────────┤
│  CycleWindow                                                 │
│  id · period · openDate · closeDate                          │
└──────────────────────────────────────────────────────────────┘
```

### User Roles

| Role | Access Level |
|------|-------------|
| `EMPLOYEE` | Own goals & achievement entries only |
| `MANAGER` | Team goals, approvals, shared goals, comments |
| `ADMIN` | Full system — users, config, audit, unlock |

---

## 📁 Project Structure

```
atomquest/
├── prisma/
│   ├── schema.prisma           # Database schema & relations
│   ├── seed.ts                 # Core seed (admin, manager, employees, cycles)
│   └── seed-dummy.ts           # Realistic demo data for testing
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + session guard wrapper
│   │   │   └── dashboard/
│   │   │       ├── page.tsx            # Role-aware home dashboard
│   │   │       ├── goals/              # Employee: goal creation & management
│   │   │       ├── progress/           # Employee: quarterly achievement logger
│   │   │       ├── team/               # Manager: team overview
│   │   │       │   ├── page.tsx
│   │   │       │   ├── SharedGoalModal.tsx
│   │   │       │   └── [id]/           # Employee goal sheet detail view
│   │   │       ├── reports/            # PDF & Excel report generation
│   │   │       ├── audit/              # Admin: audit log viewer
│   │   │       └── config/             # Admin: cycle window configuration
│   │   │
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/     # NextAuth session handler
│   │   │   ├── goals/
│   │   │   │   ├── route.ts            # POST: create a goal
│   │   │   │   └── shared/route.ts     # POST: assign shared goal to team
│   │   │   ├── goal-sheets/[id]/
│   │   │   │   ├── submit/             # POST: employee submits sheet
│   │   │   │   ├── approve/            # POST: manager locks/approves sheet
│   │   │   │   ├── return/             # POST: manager returns for edits
│   │   │   │   ├── unlock/             # POST: admin unlocks a sheet
│   │   │   │   └── edit-goals/         # PUT: manager edits targets & weightage
│   │   │   ├── achievements/
│   │   │   │   ├── route.ts            # POST: log achievement | GET: fetch
│   │   │   │   └── [id]/comment/       # POST: manager adds comment
│   │   │   └── reports/export/         # GET: export PDF or Excel report
│   │   │
│   │   └── login/                      # Login page
│   │
│   ├── components/
│   │   ├── layout/Sidebar.tsx          # Role-aware navigation sidebar
│   │   └── Providers.tsx               # NextAuth session provider
│   │
│   ├── lib/
│   │   └── prisma.ts                   # Prisma client singleton
│   │
│   └── types/                          # Shared TypeScript type definitions
│
├── .env                                # Environment variables (not committed)
├── next.config.ts
└── package.json
```

---

## 🔄 Goal Sheet Lifecycle

```
                ┌─────────────────────────────┐
                │         EMPLOYEE             │
                └──────────────┬──────────────┘
                               │ Creates goals
                               ▼
                          ┌─────────┐
                          │  DRAFT  │ ◄─────────────────────┐
                          └────┬────┘                       │
                               │ Submit                     │ Return
                               ▼                            │
                        ┌──────────────┐           ┌────────┴──────┐
                        │  SUBMITTED   │ ─────────► │    MANAGER    │
                        └──────────────┘  Review    └──────┬────────┘
                                                           │ Approve
                                                           ▼
                                                      ┌─────────┐
                                                      │  LOCKED │ ──► Achievements logged
                                                      └─────────┘
```

| Status | Who Acts | Description |
|--------|----------|-------------|
| `DRAFT` | Employee | Building & editing the goal sheet |
| `SUBMITTED` | Manager | Pending manager review |
| `LOCKED` | Employee/Manager | Approved — quarterly achievements can now be logged |

---

## ✅ Business Rules & Validation

| Rule | Detail |
|------|--------|
| Total weightage | Must equal exactly **100%** before submission |
| Minimum per goal | **10%** weightage minimum |
| Maximum goals | **8 goals** per employee per cycle |
| Achievement logging | Only allowed on **LOCKED** sheets |
| Locked sheet edits | Requires **Admin** access to unlock first |
| Shared goal assignment | Manager can only assign to their **direct reports** |
| Weightage on shared assign | Sheet is reverted to `DRAFT` with audit log entry |

### UoM Types (Unit of Measurement)

| Type | Meaning |
|------|---------|
| `MAX` | Higher achieved value = better outcome |
| `MIN` | Lower achieved value = better outcome |
| `TIMELINE` | Completion before a set deadline |
| `ZERO_BASED` | Zero incidents / defects = full success |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MySQL** 8.x database (local or cloud)
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kajaljain0820/atomquest.git
cd atomquest

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Open .env and fill in your DATABASE_URL and NEXTAUTH_SECRET

# 4. Push the schema to your database
npx prisma db push

# 5. Seed the database
npx ts-node prisma/seed.ts           # Core users, roles & cycle windows
npx ts-node prisma/seed-dummy.ts     # Optional: realistic demo goal data

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# MySQL connection string
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# NextAuth — must be a strong random secret (min 32 chars)
NEXTAUTH_SECRET="your-secret-here"

# Base URL of the app (use your Vercel URL in production)
NEXTAUTH_URL="http://localhost:3000"
```

> **Generate a secure secret:**
> ```bash
> openssl rand -base64 32
> ```

---

## 🔐 Demo Credentials

> These credentials are seeded by `prisma/seed.ts`

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@goalforge.com | admin123 |
| Manager | manager@goalforge.com | manager123 |
| Employee | employee@goalforge.com | employee123 |
| Employee 2 | employee2@goalforge.com | employee123 |

---

## 📡 API Reference

All API routes are protected by session validation via `getServerSession`. Unauthenticated requests return `401 Unauthorized`.

### Goals

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| `POST` | `/api/goals` | Create a new goal on a sheet | Employee |
| `POST` | `/api/goals/shared` | Assign a shared goal to multiple employees | Manager / Admin |

### Goal Sheets

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| `POST` | `/api/goal-sheets/[id]/submit` | Submit sheet for manager review | Employee |
| `POST` | `/api/goal-sheets/[id]/approve` | Approve & lock the sheet | Manager / Admin |
| `POST` | `/api/goal-sheets/[id]/return` | Return sheet to employee for edits | Manager / Admin |
| `POST` | `/api/goal-sheets/[id]/unlock` | Unlock a locked sheet | Admin |
| `PUT` | `/api/goal-sheets/[id]/edit-goals` | Edit goal targets & weightages | Manager / Admin |

### Achievements

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| `POST` | `/api/achievements` | Log a quarterly achievement entry | Employee / Manager / Admin |
| `GET` | `/api/achievements` | Fetch achievements (supports `?quarter=Q1` filter) | Authenticated |
| `POST` | `/api/achievements/[id]/comment` | Add a manager comment to an entry | Manager / Admin |

### Reports

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| `GET` | `/api/reports/export` | Export report as PDF or Excel | Manager / Admin |

---

## 🚢 Deployment (Vercel)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repository
3. Add the following **Environment Variables** in the Vercel dashboard:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your cloud MySQL connection string |
   | `NEXTAUTH_SECRET` | Generated secret (see above) |
   | `NEXTAUTH_URL` | Your Vercel production URL (e.g. `https://your-app.vercel.app`) |

4. Click **Deploy** — Vercel auto-detects Next.js and builds with Turbopack

> **Recommended DB providers:** [PlanetScale](https://planetscale.com/), [Railway](https://railway.app/), [Aiven](https://aiven.io/)

---

## 🔒 Security

| Measure | Implementation |
|---------|---------------|
| Password storage | Hashed with **bcryptjs** (salt rounds: 10) — never stored in plaintext |
| Session auth | Every API route validates session via `getServerSession` before execution |
| Role enforcement | API-level RBAC — employees cannot reach manager/admin endpoints |
| Input validation | All incoming payloads validated with **Zod** schemas |
| Audit trail | Every state-changing action is logged with actor identity and timestamp |

---

## 📋 Audit Log Events

| Event | Trigger |
|-------|---------|
| `REVERTED_TO_DRAFT_SHARED_GOAL` | Sheet reverted to DRAFT when a shared goal is assigned |
| Goal sheet approval | Manager locks a submitted sheet |
| Goal sheet return | Manager returns sheet to employee |
| Admin unlock | Admin unlocks a locked sheet |

---

## 📄 License

This project was developed for the **AtomQuest Hackathon 2026**. All rights reserved.

---

<div align="center">
  Built with ❤️ for AtomQuest · Powered by Next.js & Prisma
</div>
