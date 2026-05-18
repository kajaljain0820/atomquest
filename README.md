# AtomQuest Goal Tracking Portal 🎯

> **Align Goals. Track Progress. Drive Success.**

A full-stack enterprise goal-setting and performance tracking platform built with **Next.js 16**, **Prisma ORM**, and **MySQL**. Designed for the AtomQuest Hackathon, the portal enables organizations to digitize the entire employee performance lifecycle — from goal creation to quarterly achievement tracking, manager approvals, and executive reporting.

---

## ✨ Features

### 👤 Employee Portal
- Create and manage personal performance goals per cycle year
- Define targets, weightage (min 10% per goal, total must equal 100%), and UoM type
- Submit goal sheets for manager review
- Log quarterly achievements (Q1–Q4) with actual vs. target values
- Track progress status: `NOT_STARTED` → `ON_TRACK` → `COMPLETED`

### 👔 Manager Dashboard
- View all direct reportees and their goal sheets
- Approve, return, or request edits on submitted goal sheets
- Edit goal targets and weightages inline (on submitted sheets)
- Assign **Shared Goals** to multiple employees simultaneously
- Add structured comments on employee achievement entries
- Conduct quarterly check-ins and monitor team-wide progress

### 🛡️ Admin / HR Panel
- Manage full user hierarchy (employee ↔ manager relationships)
- Unlock locked goal sheets for editing
- Configure goal-setting cycle windows (open/close dates)
- View complete audit logs for all system actions
- Generate and export reports (PDF & Excel)

---

## 📋 Goal Sheet Lifecycle

```
DRAFT ──► SUBMITTED ──► LOCKED
  ▲            │
  └────────────┘ (RETURNED for edits)
```

| Status | Description |
|--------|-------------|
| `DRAFT` | Employee is building the goal sheet |
| `SUBMITTED` | Submitted for manager review |
| `LOCKED` | Approved & locked — achievements can now be logged |

---

## 📊 Validation Rules

| Rule | Detail |
|------|--------|
| Total weightage | Must equal exactly **100%** |
| Min weightage per goal | **10%** |
| Max goals per employee | **8** |
| Locked sheet editing | Requires **Admin** access |
| Achievement logging | Only allowed on **LOCKED** sheets |
| Shared goal assignment | Manager can only assign to their own direct reports |

---

## 📐 UoM Types (Unit of Measurement)

| Type | Meaning |
|------|---------|
| `MAX` | Higher value = better performance |
| `MIN` | Lower value = better performance |
| `TIMELINE` | Completion before a deadline |
| `ZERO_BASED` | Zero incidents/defects = success |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | MySQL |
| ORM | Prisma |
| Auth | NextAuth.js (JWT + credentials) |
| Password Hashing | bcryptjs |
| Validation | Zod |
| PDF Reports | jsPDF |
| Excel Reports | ExcelJS |
| Deployment | Vercel |

---

## 🗄️ Database Schema

```
User
 ├─ id, email, password, name, role, msEntraId
 ├─ managerId → User (self-referential)
 └─ goalSheets → GoalSheet[]

GoalSheet
 ├─ id, employeeId, cycleYear, status, createdAt, lockedAt
 └─ goals → Goal[]

Goal
 ├─ id, goalSheetId, title, description, thrustArea
 ├─ uomType, target, weightage
 ├─ isShared, parentGoalId
 └─ achievements → GoalAchievement[]

GoalAchievement
 ├─ id, goalId, quarter, actualAchievement
 ├─ status, managerComment, loggedAt

AuditLog
 ├─ id, entityId, entityType, action
 ├─ oldValues, newValues, changedById, timestamp

CycleWindow
 └─ id, period, openDate, closeDate
```

### User Roles
| Role | Access Level |
|------|-------------|
| `EMPLOYEE` | Own goals & achievements |
| `MANAGER` | Team goals, approvals, shared goals, comments |
| `ADMIN` | Full system access, audit logs, config |

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + session guard
│   │   └── dashboard/
│   │       ├── page.tsx            # Main dashboard (role-aware)
│   │       ├── goals/              # Employee goal management
│   │       ├── progress/           # Quarterly achievement logging
│   │       ├── team/               # Manager's team view
│   │       │   ├── page.tsx
│   │       │   ├── SharedGoalModal.tsx
│   │       │   └── [id]/           # Individual employee goal sheet
│   │       ├── reports/            # Report generation
│   │       ├── audit/              # Audit log viewer
│   │       └── config/             # Admin: cycle window config
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth session handler
│   │   ├── goals/
│   │   │   ├── route.ts            # POST: create goal
│   │   │   └── shared/route.ts     # POST: assign shared goals
│   │   ├── goal-sheets/[id]/
│   │   │   ├── submit/             # POST: submit for review
│   │   │   ├── approve/            # POST: lock sheet
│   │   │   ├── return/             # POST: return for edits
│   │   │   ├── unlock/             # POST: admin unlock
│   │   │   └── edit-goals/         # PUT: manager edits targets
│   │   ├── achievements/
│   │   │   ├── route.ts            # POST: log achievement, GET: fetch
│   │   │   └── [id]/comment/       # POST: add manager comment
│   │   └── reports/export/         # GET: generate PDF/Excel
│   └── login/                      # Login page
├── components/
│   ├── layout/Sidebar.tsx          # Role-aware navigation sidebar
│   └── Providers.tsx               # NextAuth session provider
├── lib/
│   └── prisma.ts                   # Prisma client singleton
├── types/                          # TypeScript type definitions
└── proxy.ts                        # Dev proxy config
prisma/
├── schema.prisma                   # Database schema
├── seed.ts                         # Production seed (admin + roles)
└── seed-dummy.ts                   # Demo seed with realistic test data
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root with the following:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

> **Tip:** Generate a strong secret with:
> ```bash
> openssl rand -base64 32
> ```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+ database

### Installation

```bash
# Clone the repository
git clone https://github.com/kajaljain0820/atomquest.git
cd atomquest

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Run database migrations
npx prisma db push

# Seed the database
npx ts-node prisma/seed.ts          # Core users & roles
npx ts-node prisma/seed-dummy.ts    # Demo data (optional)

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@atomquest.com | admin123 |
| Manager | manager@atomquest.com | manager123 |
| Employee | employee@atomquest.com | employee123 |

---

## 🌐 API Reference

### Goals
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/goals` | Create a new goal | Employee |
| `POST` | `/api/goals/shared` | Assign shared goal to team | Manager/Admin |

### Goal Sheets
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/goal-sheets/[id]/submit` | Submit sheet for review | Employee |
| `POST` | `/api/goal-sheets/[id]/approve` | Lock/approve sheet | Manager/Admin |
| `POST` | `/api/goal-sheets/[id]/return` | Return sheet for edits | Manager/Admin |
| `POST` | `/api/goal-sheets/[id]/unlock` | Unlock a locked sheet | Admin |
| `PUT` | `/api/goal-sheets/[id]/edit-goals` | Edit targets & weightages | Manager/Admin |

### Achievements
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/achievements` | Log a quarterly achievement | Employee/Manager/Admin |
| `GET` | `/api/achievements` | Fetch achievements (with quarter filter) | Authenticated |
| `POST` | `/api/achievements/[id]/comment` | Add manager comment | Manager/Admin |

### Reports
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/reports/export` | Export PDF or Excel report | Manager/Admin |

---

## 🚢 Deployment (Vercel)

1. Push your code to GitHub
2. Connect the repository on [vercel.com](https://vercel.com)
3. Add the following **Environment Variables** in the Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your Vercel production URL)
4. Deploy — Vercel auto-detects Next.js and builds accordingly

> **Note:** Ensure your MySQL database is accessible from Vercel's network. Use PlanetScale, Railway, or any cloud MySQL provider.

---

## 🔒 Security

- Passwords are hashed with **bcryptjs** before storage — never stored in plaintext
- All API routes validate the active session via `getServerSession` before processing
- Role-based guards enforce that employees cannot access manager/admin endpoints
- Audit logs record every state-changing action (approvals, unlocks, reversions) with actor identity and timestamps
- Zod schema validation on all incoming API payloads

---

## 📝 Audit Logging

Every significant action is recorded in the `AuditLog` table:

| Action | Trigger |
|--------|---------|
| `REVERTED_TO_DRAFT_SHARED_GOAL` | Sheet reverted when a shared goal is added |
| Goal approvals & rejections | Manager approve/return actions |
| Sheet unlocks | Admin unlock operations |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project was built for the **AtomQuest Hackathon**. All rights reserved.
