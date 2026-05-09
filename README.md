## Problem statement
My aunt owns a small business but currently does not have a website or digital system to manage her business operations. Most tasks are handled manually through social media, messages, and handwritten tracking, making it difficult to stay organized and efficiently manage inventory, sales, customer communication, and orders. These challenges can lead to inventory mistakes, lost sales opportunities, poor customer experience, and difficulty growing the business.

## Solution
The proposed solution is a business management web application that gives my aunt a centralized platform to manage her business digitally. The application allows customers to view products online while also helping the business manage inventory, track sales, organize customer information, and improve overall efficiency.

## Features
- Admin authentication and protected routes.
- Product and stock management.
- Customer request creation and confirmation workflow.
- Sales recording, including manual sales entry.
- Dashboard metrics and weekly sales summaries.
- Audit logs for important admin actions.

## Tech stack
- Next.js (App Router)
- React
- Node.js
- Prisma ORM
- PostgreSQL (`pg`)
- NextAuth.js
- Zod (validation)
- Vitest
- ESLint

## Technical constraints
- The app requires `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
- The app depends on PostgreSQL for core data operations.
- Prisma client generation is required before build and runtime.
- Admin access must follow role-based authorization rules.
- Online payments are out of scope for this version (no payments).
- Real-time chat and advanced analytics are not included yet.

## Core features
- Secure admin login with role-based route protection.
- Product catalog and stock management for daily operations.
- Customer request workflow from creation to confirmation.
- Manual sales entry with transaction-safe validation.
- Customer lookup and request/sales history view.
- Dashboard metrics and weekly sales summary generation.
- Audit logging for authentication and sensitive actions.

## Installation
1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```bash
DATABASE_URL=your_postgres_connection_string
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

3. Generate Prisma client:

```bash
npm run postinstall
```

4. (Optional) Seed the database:

```bash
npx prisma db seed
```

5. Start development server:

```bash
npm run dev
```

6. Open the app at `http://localhost:3000`.
