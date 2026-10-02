<div align="center">
  
  <h1>🏆 Shaurya QR Ecosystem</h1>

<strong>The Ultimate QR-Based Event & Food Management Platform</strong>

<br><br>

  <p>
    <em>Manage thousands of event participants, instantly assign QR cards, and track food distribution with zero bottlenecks. Built for scale, designed for speed.</em>
  </p>

  <hr>
</div>

## 💡 The Problem & The Solution

**Imagine hosting a massive college fest or tech conference with thousands of attendees.**
You need to register people quickly, hand them physical IDs, and make sure nobody takes double portions at the food stalls. Manual checking creates chaos, long lines, and data loss.

**Enter the Shaurya QR Ecosystem.** 🚀

We built a lightning-fast, QR-powered system.

- 📱 **Volunteers** use their smartphone cameras to scan participant QR cards and instantly verify if they are eligible for the current meal.
- 👑 **Administrators** sit in the command center with a real-time dashboard showing exactly who is eating, who is scanning, and how the event is progressing.

---

## 🚦 The User Journey (How it Works)

The entire flow is designed to be frictionless:

1. 📝 **Registration:** A participant visits the blazing-fast public website and registers.
2. 🤝 **Arrival & QR Assignment:** The participant arrives at the venue. A volunteer searches their name on the dashboard, hands them a physical QR card, and scans it to link the card to the person.
3. 🍔 **Food Distribution:** At lunchtime, the participant shows their QR card. The volunteer scans it. The system instantly flashes **"Approved"** (enjoy your meal!) or **"Rejected"** (already eaten!).

---

## ✨ Features You Will Love

### 👑 For Administrators (The Command Center)

- **📈 Live Analytics:** See exact numbers for registrations, meals served, and QR cards remaining in real-time.
- **⏱️ Meal Slot Control:** Easily start "Breakfast", pause it, and then start "Lunch" with the click of a single button.
- **🕵️ Audit Logs:** Absolute accountability. Every single scan, assignment, and registration is permanently recorded.

### 🧑‍💼 For Volunteers (The On-Ground Heroes)

- **⚡ Super-Fast Scanning:** Scans QR codes directly from the web browser using the phone's built-in camera—no app downloads required!
- **🔒 Privacy-First:** Volunteers only see the specific data they need. They cannot export or view the full participant list.

---

## 🏗️ Architecture & 📂 Project Structure

To ensure the system **never crashes** during peak hours, the project is structured as a Monorepo split into two distinct apps:

```text
shaurya-QR/
├── apps/
│   ├── registration-page/       # 🌐 The public website (HTML/JS/CSS)
│   │   ├── index.html           # The main registration form
│   │   └── config.js            # Points the form to the secure API
│   │
│   └── unified-platform/        # 🔐 The secure Admin & Volunteer App (Next.js)
│       ├── prisma/              # Database schema and tables
│       ├── scripts/             # Scripts to bulk-import QRs and Users
│       ├── src/
│       │   ├── app/             # Next.js Pages (Dashboard, Scanner, Login)
│       │   ├── components/      # Reusable UI (Buttons, Cards, Navbars)
│       │   ├── lib/             # Helper utilities (Auth, Passwords)
│       │   └── server/data/     # Backend Logic (Database interactions)
│       └── package.json         # Unified Platform dependencies
└── package.json                 # Monorepo root dependencies
```

> **Why this split?** The public registration site (`registration-page`) has zero direct access to the database. It is 100% static, meaning it is impossible to hack or crash via database overload. All heavy lifting is handled safely by the `unified-platform`.

## Project history

**Shaurya QR Ecosystem** is the latest version of the project.

The previous implementation is preserved in [`NileshSankhla/Shaurya-Food-counter-2026`](https://github.com/NileshSankhla/Shaurya-Food-counter-2026). That project was the original food-counter application built with React/Vite, Express, JWT authentication, and MongoDB.

This fork, [`NileshSankhla/shaurya-QR`](https://github.com/NileshSankhla/shaurya-QR), is the combined project home for current development and deployment. The old repository remains available for historical reference, while this repository contains the latest monorepo architecture and workflows.

The repositories were developed as separate Git histories. Their relationship is documented here without replacing the current Shaurya QR application.

---

## 🚀 How to Run It on Your Machine

Want to test it out? Follow these steps to get a local copy up and running:

### 1. Prerequisites

- **Node.js** (v20 or higher)
- **PostgreSQL** Database (Local or Cloud)

### 2. Setup the Code

```bash
# Clone the repository to your machine
git clone https://github.com/bhanupratap07-hack/shaurya-QR.git

# Enter the project directory
cd shaurya-QR

# Install all dependencies
npm install
```

### 3. Setup the Database

```bash
# Navigate to the main app folder
cd apps/unified-platform

# Copy the example environment file
cp .env.example .env

# ---> IMPORTANT: Open the `.env` file and add your PostgreSQL database link! <---

# Create the database tables
npm run db:push

# Create the first Master Admin account
npm run db:seed
```

### 4. Start the Application!

```bash
# Go back to the main folder
cd ../../

# Run the app
npm run dev
```

> **🔥 Pro-Tip for Mobile Testing:**
> If you want to test the QR Camera scanner on your phone, you **must** run `npm run dev:https` instead. Modern phone browsers strictly require a secure HTTPS connection to turn on the camera!

---

<div align="center">
  <h3>Ready for your next big event. 🚀</h3>
  <p><i>Built with security, speed, and scale in mind.</i></p>
</div>
