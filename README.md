# GoalForge 🚀

### Align Goals. Track Progress. Drive Success.

GoalForge is a modern enterprise goal-setting and performance tracking platform built for the **AtomQuest Hackathon**. The platform enables organizations to streamline employee goal management, manager approvals, quarterly check-ins, and performance reporting through a centralized digital workflow.

---

## ✨ Features

### 👨‍💼 Employee Portal
- Create and manage performance goals
- Define targets, weightage, and measurement types
- Submit goals for manager approval
- Update quarterly achievements and progress
- Track goal completion status

### 👨‍💻 Manager Dashboard
- Review and approve employee goals
- Edit targets and weightages inline
- Conduct quarterly check-ins
- Add structured feedback/comments
- Monitor team progress in real time

### 🛡️ Admin / HR Panel
- Manage users and organizational hierarchy
- Unlock/edit locked goals
- Track completion rates
- View audit logs and system activity
- Generate downloadable reports

---

## 📊 Core Functionalities

- Goal Creation & Approval Workflow
- Role-Based Access Control (RBAC)
- Quarterly Achievement Tracking
- Real-Time Progress Monitoring
- System-Enforced Validation Rules
- Audit Trail Logging
- Professional PDF & Excel Reporting
- Responsive Enterprise UI

---

## ✅ Validation Rules

GoalForge enforces the following business rules:

- Total goal weightage must equal **100%**
- Minimum weightage per goal: **10%**
- Maximum goals per employee: **8**
- Locked goals cannot be modified without admin access

---

## 📈 Supported UoM Types

| Type | Description |
|------|-------------|
| Min | Higher achievement is better |
| Max | Lower achievement is better |
| Timeline | Deadline/date-based goals |
| Zero | Zero incidents/errors = success |

---

## 🏗️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Next.js API Routes
- NextAuth.js Authentication

### Database
- MySQL
- Prisma ORM

### Authentication & Security
- JWT Authentication
- bcryptjs Password Hashing
- Role-Based Route Protection

### Reporting
- jsPDF
- ExcelJS

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@goalforge.com | admin123 |
| Manager | manager@goalforge.com | manager123 |
| Employee | employee@goalforge.com | employee123 |

---


