# 🚀 Shaurya QR & Event Management Platform

## 1. Project Overview

**Shaurya QR** is a complete, unified digital platform designed for high-scale college events and festivals. It replaces chaotic pen-and-paper registration and meal-tracking systems with a secure, real-time, QR-based verification architecture.

✨ **Main Purpose:** To provide a seamless, end-to-end event experience for participants, volunteers, and administrators by digitizing registrations, automating QR assignments, and enforcing strict anti-duplicate meal distribution.

🛠 **Key Problems Solved:**
* **Chaos at Food Stalls:** Eliminates long queues and manual token verification by using lightning-fast mobile QR scanning.
* **Duplicate Meals & Fraud:** Cryptographically secure QR assignments and strict database constraints ensure one meal per person, per slot.
* **Lack of Visibility:** Replaces blind operations with a real-time analytics dashboard for administrators to monitor live capacity, scan attempts, and volunteer performance.

🎯 **Target Users:**
* **Participants/Guests:** Register for the event and receive physical/digital QR credentials.
* **Volunteers/Staff:** Authenticate securely and use their own mobile devices to scan QR codes at various checkpoints.
* **Administrators:** Oversee the entire operation, manage the team, schedule food slots, and view live metrics.

---

## 2. ✨ Features

### 👥 User & Participant Features
* **Public Registration Portal:** A clean, mobile-optimized onboarding flow for guests to input their details (Name, College, Mobile, Email).
* **Idempotent Assignments:** Ensures participants are never accidentally assigned multiple QR credentials.

### 🛡️ Volunteer & Staff Features
* **Role-Based Access Control (RBAC):** Distinct dashboards and capabilities for `ADMIN` and `VOLUNTEER` roles.
* **Live QR Scanner:** Built-in mobile camera integration to instantly scan, decode, and verify QR tokens.
* **Real-time Live Feed:** A live, localized stream of recent scan activities (successes and failures) directly on the volunteer dashboard.
* **Installable PWA:** Standards-based manifest, platform icons, update handling, connection status, and a safe offline fallback without caching protected operational data.

### 👑 Administrator Dashboard
* **Live Overview Metrics:** High-level statistics of Active Participants, Assigned QRs, Verified Meals, and Active Staff.
* **Dynamic Slot Management:** Admins can create, schedule, pause, or resume food slots. 
* **Smart Time Verification:** Food slots automatically activate and deactivate based on `startTime` and `endTime`, with manual override capabilities.
* **Team Management:** Add, edit, remove, and monitor volunteer performance seamlessly.

### ⚙️ Backend & Database Capabilities
* **Pool-Aware Data Fetching:** Related dashboard reads use batched Prisma transactions so low-limit transaction poolers are not flooded by one request.
* **Strict Constraints:** PostgreSQL enforces uniqueness on `[guestId, slotId]` to physically prevent duplicate meal entries at the database level.

---

## 3. 🔄 Complete User Workflow

1. **Guest Registration:**
   * Participant opens the public registration portal.
   * Enters details (Name, College, Mobile, Email).
   * Data is validated and stored in the database with an `UNASSIGNED` status.
2. **QR Assignment (At the physical desk):**
   * A physical QR card (e.g., `SH26-0001`) is handed to the guest.
   * The Admin scans the QR card and assigns it to the guest's profile in the database.
3. **Event & Meal Verification (At the food stall):**
   * Guest presents their QR card at the lunch counter.
   * Volunteer opens the Scanner App and scans the QR code.
   * System verifies: Is the slot active? Is the QR assigned? Has this person already eaten?
   * If valid: Success screen flashes green, database records the meal.
   * If invalid: Error screen flashes red with the exact reason (e.g., "Already verified").
4. **Admin Monitoring:**
   * Admins watch the live dashboard as numbers update in real-time.

---

## 4. 🔐 Registration & Authentication Flow

* **Registration:** The public static form calls a restricted-origin API. Inputs are validated on the server, with database constraints enforcing mobile/email uniqueness.
* **Staff Authentication:** 
  * Volunteers and Admins log in using a username and password.
  * Passwords are verified with scrypt and the backend creates a signed, expiring session payload.
  * The signed session is stored in a secure, same-site, HTTP-only browser cookie (`shaurya_session`).
* **Session Handling:** 
  * Next.js Proxy performs the fast cookie-presence redirect for protected routes.
  * Protected layouts and every server action verify the signature and fresh-read the staff record, invalidating disabled accounts immediately.
* **Security Practices:** Passwords and secrets remain server-only. Responses include clickjacking, MIME-sniffing, referrer, and browser-permission protections.

---

## 5. 🛠 Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | Next.js 16 + React 19 (App Router) | Core framework for server rendering and interactive UI |
| **Styling** | Tailwind CSS | Utility-first CSS for a custom, modern design system |
| **Backend** | Next.js Server Actions | Server-side API logic without traditional endpoints |
| **Database** | PostgreSQL (Supabase) | Relational database for strict data integrity |
| **ORM** | Prisma | Type-safe database queries and schema management |
| **Auth** | HMAC-signed sessions + scrypt | Secure session management and password hashing |
| **PWA** | Web App Manifest + Service Worker | Installability, updates, static asset caching, and safe offline fallback |
| **Icons** | Lucide React | Clean, consistent, and lightweight iconography |

---

## 6. 🏗 Project Architecture

The application follows a modern Serverless Monolith architecture using Next.js App Router.

```text
shaurya-QR/
│
└── apps/
    └── unified-platform/
        ├── prisma/            # Database schema and migrations
        ├── public/            # Static assets (images, icons)
        ├── src/
        │   ├── app/           # Next.js Routes & Server Actions
        │   ├── components/    # Reusable React UI Components
        │   ├── lib/           # Utility functions (Auth, Session)
        │   └── server/        # Database access layer (Prisma Store)
        └── scripts/           # DB seeding and QR import scripts
```

* **`src/app/`**: Handles the routing tree. Uses Layouts for shared UI (like dashboards) and Pages for specific views.
* **`src/server/`**: The Data Access Layer. Isolates Prisma logic from the UI components to ensure clean architecture and prevent database logic from leaking into the frontend.
* **`src/components/`**: Organized by domain (admin, volunteer, dashboard) for scalable component management.

---

## 7. 🚀 How To Clone The Project

To get a copy of this project on your local machine, open your terminal and run:

```bash
# Clone the repository
git clone https://github.com/your-username/shaurya-QR.git

# Enter the project directory
cd shaurya-QR/apps/unified-platform
```

---

## 8. 💻 Local Development Setup

### Prerequisites
* **Node.js**: v20.9 or higher
* **Package Manager**: npm (v9+)
* **Database**: A PostgreSQL connection URI (e.g., local Postgres or Supabase)

### Installation Steps

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file in the root of `unified-platform` and add your database variables:
   ```env
   # .env
   DATABASE_URL="postgresql://user:password@host:port/dbname?connection_limit=5"
   DIRECT_URL="postgresql://user:password@host:port/dbname"
   AUTH_SECRET="generate-a-secure-random-string"
   ```

3. **Database Setup (Prisma):**
   ```bash
   # Push the schema to your database
   npx prisma db push

   # Generate the Prisma Client
   npx prisma generate
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will now be running on `http://localhost:3000`.

5. **Run the complete verification suite:**
   ```bash
   npm run verify
   ```

---

## 9. 📂 Folder Structure & Key Files

* **`prisma/schema.prisma`**: The heart of the backend. Defines the tables (Guest, QrCard, Volunteer, FoodSlot, ScanEvent) and their relationships.
* **`src/app/actions.ts`**: Contains all Next.js Server Actions. This is how the frontend securely communicates with the database.
* **`src/lib/auth.ts`**: Contains the JWT signing and verification logic.
* **`src/server/data/prisma-store.ts`**: A robust class that handles complex database transactions, connection pooling limits, and data aggregation for the dashboards.

---

## 10. 🔒 Security Considerations

* **Route Protection:** Next.js Proxy performs an early cookie check for `/admin` and `/volunteer`; layouts and server actions then validate the signed session and current database-backed staff access.
* **Input Validation:** Server actions strictly validate inputs before executing database queries to prevent bad data.
* **Database Security:** `PgBouncer` or Prisma connection pooling is utilized via `connection_limit=5` in the `.env` to prevent the database from crashing under high traffic loads.
* **Idempotency:** Webhook and scan verification logic uses strict database constraints (unique indexes) to ensure that if two volunteers scan the same QR code at the exact same millisecond, only one transaction succeeds, preventing duplicate meals.

---

## 11. ☁️ Deployment Guide

This application is optimized for a Node.js serverless deployment on platforms like Vercel. Prisma-backed routes are not Edge-runtime routes.

**Deploying to Vercel:**
1. Push your code to a GitHub repository.
2. Log into Vercel and click **Add New Project**.
3. Import your GitHub repository.
4. Set the **Framework Preset** to Next.js.
5. In the **Environment Variables** section, add your `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET`.
6. Click **Deploy**.

**Database Deployment:**
It is highly recommended to host your PostgreSQL database on **Supabase**. Ensure that you use the **Connection Pooling (IPv4)** URL for the `DATABASE_URL` and the **Session/Direct URL** for the `DIRECT_URL` in your environment variables to ensure Prisma functions correctly in a serverless environment.
