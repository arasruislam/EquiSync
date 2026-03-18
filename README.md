# QuoteXStudio - Advanced Internal Management System

**QuoteXStudio** is a high-performance, secure, and visually stunning internal management platform designed for modern agencies. It provides a unified ecosystem for financial tracking, capital distribution, project management, and real-time operational oversight.

---

## 🚀 Key Features

### 🛡️ Ironclad Security & Auth
- **Multi-Layered Route Protection**: Next.js Edge Middleware combined with Server-Side Layout Guards prevents any UI leakage for unauthenticated users.
- **Role-Based Access Control (RBAC)**: Granular permissions for `SUPER_ADMIN`, `CO_FOUNDER`, `LEADER`, and `EMPLOYEE`.
- **Session Management**: Secure JWT-based sessions with a 20-minute inactivity timeout and warning system.

### 📊 Financial Intelligence
- **Dual-Currency Dashboards**: Real-time tracking in both **BDT (Primary)** and **USD (Secondary)** with automated exchange rate integration.
- **Founder Capital Matrix**: Automated 3-way equal-split logic for investments and expenses with individual dues tracking.
- **Enterprise Reporting**: Interactive analytics powered by Recharts, featuring time-series trends and founder-specific inflow/outflow.

### ⚡ Real-Time Operations
- **Live Sync Architecture**: WebSocket integration (Socket.io) ensures all clients update instantaneously when data mutations occur.
- **System Audit Trace**: Comprehensive mutation logging capturing "Before/After" diffs for every critical administrative action.
- **Advanced Loaders**: Dual-tier loading system (Global Splash + Main Content) for a frictionless, high-end UX.

### 🎨 Premium Aesthetic
- **Glassmorphism UI**: A sleek, dark-blue and royal-blue theme with smooth gradients and depth effects.
- **Refined Scrollbars**: Global, unobtrusive glassmorphism scrollbars with interactive electric blue highlights.
- **Branded Fallback UI**: Professional, themed error boundaries and 404 pages (Request Nullified) to maintain branding integrity during faults.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Real-Time**: [Socket.io](https://socket.io/)
- **Auth**: [NextAuth.js](https://next-auth.js.org/)
- **Charts**: [Recharts](https://recharts.org/)
- **Utilities**: Lucide Icons, Date-fns, Zod, Bcryptjs

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+
- MongoDB Instance (Atlas or Local)

### 2. Installation
```bash
git clone https://github.com/arasruislam/EquiSync.git
cd QuoteXStudio
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
ENCRYPTION_KEY=your_32_char_encryption_key
```

### 4. Database Seeding
Initialize the system with default co-founders and sample data:
```bash
npm run seed
```

### 5. Development
```bash
npm run dev
```
Access the platform at `http://localhost:3000`.

---

## 📁 Architectural Reference
For a complete mapping of all application paths and API endpoints, please refer to the **[routes.md](./routes.md)** directory.

---
© 2026 QuoteXStudio Operations | Internal Repository: EquiSync
