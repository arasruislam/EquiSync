# QuoteXStudio - Routing Architecture

This document serves as the centralized directory for all frontend navigation paths and API endpoints within the QuoteXStudio Internal Management platform.

## 🔓 Public Routes
Routes accessible without an active session.

| Path | Description | Access |
| :--- | :--- | :--- |
| `/login` | Primary Authentication Portal | Public |
| `/` | Root Redirector | Auto-redirects to `/dashboard` (Auth) or `/login` (Unauth) |

## 🛡️ Protected Dashboard (Frontend)
All routes below require a valid JWT session. Protection is enforced via **Next.js Edge Middleware** and **Server-Side Layout Guards** (Zero-Tolerance Policy).

| Path | Description | Minimum Access Role |
| :--- | :--- | :--- |
| `/dashboard` | Executive Overview & Recent Activity | EMPLOYEE |
| `/dashboard/reports` | Financial Analytics & Interactive Charts | CO_FOUNDER |
| `/dashboard/investments` | Capital Management & Founder Shares | CO_FOUNDER |
| `/dashboard/expenses` | Operational Overhead & Cost Tracking | LEADER |
| `/dashboard/payouts` | Founder Withdrawals & Disbursement Ledger | CO_FOUNDER |
| `/dashboard/marketplace` | Fiverr Income & Transaction Stats | LEADER |
| `/dashboard/projects` | Project Pipeline & Resource Allocation | LEADER |
| `/dashboard/ledger` | Unified Financial Transaction History | CO_FOUNDER |
| `/dashboard/activity` | System-wide Audit Log & Mutation Trace | LEADER |
| `/dashboard/users` | User Directory & Role Assignment | SUPER_ADMIN |
| `/dashboard/profile` | Personal Account Settings (Placeholder) | EMPLOYEE |
| `/dashboard/settings` | Global System Configuration (Placeholder) | SUPER_ADMIN |

## 📡 API Endpoints (`/api/*`)
Secure backend nodes for data mutation, aggregation, and real-time event broadcasting.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/*` | POST/GET | NextAuth Session & JWT Lifecycle |
| `/api/reports` | GET | Aggregated Dashboard & Analytics Data |
| `/api/analytics` | GET | Financial Trends & Time-series Metrics |
| `/api/investments` | GET/POST | Capital Injection Management |
| `/api/investments/[id]` | PUT/DELETE | Capital Mutation & Dues Recalculation |
| `/api/expenses` | GET/POST | Operational Overhead CRUD |
| `/api/expenses/[id]` | PUT/DELETE | Expense record modification |
| `/api/projects` | GET/POST | Project Life-cycle & Share Assignment |
| `/api/projects/[id]` | PUT/DELETE | Project data mutation |
| `/api/marketplace/fiverr/income` | GET/POST | Fiverr Revenue & Status Tracking |
| `/api/payouts` | GET/POST | Founder Payout Record Management |
| `/api/audit` | GET | system-generated Audit Trace (Paginated) |
| `/api/notifications` | GET/PATCH | Notification distribution & read status |
| `/api/users` | GET/POST | Internal User Management |
| `/api/socket/io` | GET | WebSocket Server Initialization |
| `/api/socket/emit` | POST | Live Cross-Client Sync Bridge |

---
**Security Enforcement**: 
- **Tier 1**: `middleware.ts` (Edge Runtime verification)
- **Tier 2**: `src/app/dashboard/layout.tsx` (Server Component guard)
- **Tier 3**: `getServerSession` (API Node authorization)
