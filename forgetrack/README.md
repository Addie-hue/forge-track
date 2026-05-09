<p align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="ForgeTrack Logo" />
</p>

<h1 align="center">ForgeTrack</h1>

<p align="center">
  <strong>AI-Powered Attendance & Material Tracker for Mentorship Cohorts</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#database-setup">Database Setup</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#environment-variables">Environment Variables</a>
</p>

---

## ✨ Features

### 🧑‍🏫 Mentor Dashboard
- **Real-time Analytics** — Live stats on total students, average attendance rate, and today's session status
- **Session Management** — Create and manage class sessions (offline, online, assignment)
- **Mark Attendance** — Dual-pane interface with bulk Present/Absent marking for entire student rosters
- **Student History** — Searchable records with individual attendance percentages and full session logs
- **Materials Hub** — Upload and organize slides, recordings, and documents linked to specific sessions

### 🤖 AI-Powered CSV Import
- **Smart Column Detection** — Upload any attendance CSV and **Google Gemini 2.5 Flash** automatically identifies the USN column and date/session columns
- **Data Unpivoting** — Converts matrix-format spreadsheets (students × dates) into normalized database records
- **Batch Upsert** — Safely syncs hundreds of attendance records with conflict resolution
- **Import Logging** — Tracks every import with file name, row count, and success/failure status

### 🎓 Student Portal
- **My Attendance** — Dynamic circular gauge showing personal attendance rate with color-coded thresholds (green ≥75%, yellow ≥60%, red <60%)
- **Upcoming Sessions** — Grid view of future scheduled classes
- **Study Materials** — Read-only access to all slides, docs, and recordings shared by mentors

### 🔐 Security
- **Row Level Security (RLS)** — PostgreSQL policies ensuring students can only access their own data
- **Automatic Role Detection** — Auth trigger classifies users as `mentor` or `student` based on email pattern
- **Dual Authentication** — Separate login flows for mentors (email) and students (USN)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite |
| **Styling** | Tailwind CSS v3 (Dark Cosmic theme) |
| **Backend** | Supabase (PostgreSQL, Auth, RLS) |
| **AI** | Google Gemini 2.5 Flash |
| **CSV Parsing** | PapaParse |
| **Icons** | Lucide React |
| **Routing** | React Router v7 |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (for CSV import)

### Installation

```bash
# Clone the repository
git clone https://github.com/Addie-hue/forge-track.git
cd forge-track/forgetrack

# Install dependencies
npm install

# Create your environment file
cp .env.example .env.local
# Edit .env.local with your credentials (see Environment Variables below)

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🗄️ Database Setup

Run these SQL scripts **in order** in the Supabase SQL Editor:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `supabase/schema.sql` | Creates tables: `students`, `sessions`, `attendance`, `materials`, `import_log`, `users` |
| 2 | `supabase/rls_policies.sql` | Enables Row Level Security and creates access policies |
| 3 | `supabase/auth_trigger.sql` | Creates the trigger that auto-profiles new users on signup |
| 4 | `supabase/seed.sql` | Seeds 60 students with USNs (`4SH24CS001`–`4SH24CS060`) |
| 5 | **Dashboard** → Auth → Add User | Create mentor: `nischay@theboringpeople.in` / `hi123` (Auto Confirm ✓) |

> **Important:** Create auth users through the Supabase Dashboard (Authentication → Users → Add User), **not** via SQL. Check "Auto Confirm User" for each user.

---

## 📁 Project Structure

```
forgetrack/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── layout/          # AppShell, Sidebar, TopBar, MobileNav, CosmicGlow
│   │   └── ui/              # Button, Card, Input, Modal, Table, StatusPill, etc.
│   ├── contexts/
│   │   └── AuthContext.jsx   # Authentication state management
│   ├── lib/
│   │   ├── supabase.js       # Supabase client singleton
│   │   ├── gemini.js         # Gemini AI integration for CSV analysis
│   │   └── constants.js      # App-wide constants
│   ├── pages/
│   │   ├── mentor/           # DashboardPage, MarkAttendancePage, StudentHistoryPage,
│   │   │                     # MaterialsPage, CsvUploadPage
│   │   ├── student/          # MyAttendancePage, UpcomingPage, MyMaterialsPage
│   │   ├── LoginPage.jsx
│   │   ├── ForbiddenPage.jsx
│   │   └── ChangePasswordPage.jsx
│   ├── App.jsx               # Route definitions & guards
│   ├── main.jsx              # Entry point
│   └── index.css             # Tailwind + design tokens
├── supabase/                 # SQL migration scripts
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the `forgetrack/` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key (Settings → API) |
| `VITE_GEMINI_API_KEY` | Google AI Studio API key for Gemini 2.5 Flash |

> ⚠️ Never commit `.env.local` to version control. It's already in `.gitignore`.

---

## 👤 Demo Credentials

| Role | Login | Password |
|------|-------|----------|
| Mentor | Email:  `nischay@theboringpeople.in` | Password: `hi123` |
| Student | USN: `4SH24CS001` | Password: `4SH24CS001` |

Students log in using the **Student Login** tab with their USN (no `@forge.local` needed — the app appends it automatically).

---

## 📄 License

This project is built for **The Forge** mentorship program. All rights reserved.

---

<p align="center">
  Built with ❤️ using React, Supabase, and Gemini AI
</p>
