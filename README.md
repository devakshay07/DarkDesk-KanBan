# ◆ DarkDesk Kanban

[![Live Demo](https://img.shields.io/badge/Live%20Demo-darkdesk.netlify.app-00DC82?style=for-the-badge&logo=netlify&logoColor=white)](https://darkdesk.netlify.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

> A sleek, high-performance personal & multi-device Kanban workspace built with **Next.js 15**, **TypeScript**, and **Supabase**. DarkDesk provides a tactile, dark-mode board interface with instant local responsiveness and effortless real-time sync across all your devices.

*Live Application:* **[https://darkdesk.netlify.app](https://darkdesk.netlify.app)**

---

## 🌟 Key Features

- ⚡ **Local-First & Instant UI**: Zero-latency card movements and workspace updates backed by local state and `localStorage`.
- 🔄 **Realtime Multi-Device Sync**: Edits made on one device instantly reflect across all logged-in devices via Supabase Postgres Realtime channels.
- 🚀 **Optimized for Supabase Free Tier**: Features smart debounced uploads (500ms) and self-echo suppression guards to reduce database bandwidth & egress by **~90%**.
- 📋 **Flexible Board & Column Management**: Create multiple boards, customize columns, rename or reorder workflows with ease.
- 🏷️ **Rich Task Metadata**: Categorize cards with custom labels, due dates, task descriptions, and priority tags (`Urgent`, `High`, `Medium`, `Low`).
- 🔍 **Instant Search & Filter**: Dynamically filter tasks by query text or priority level across columns.
- 🔐 **Supabase Authentication**: Secure user login supporting standard Email/Password and passwordless Magic Links.
- 🎨 **Tactile Dark Aesthetics**: Layered surfaces, subtle elevation, glassmorphic accents, and smooth micro-animations.
- 💾 **Workspace Import & Export**: One-click JSON workspace backup and restore capabilities.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/devakshay07/DarkDesk-KanBan.git
cd DarkDesk-KanBan
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*(Note: If Supabase credentials are omitted, DarkDesk will gracefully run in Local-Only mode.)*

### 4. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🗄️ Supabase Setup & Database Schema

To enable multi-device sync and cloud backup:

1. Create a free project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Copy and run the contents of [`database/schema.sql`](database/schema.sql).
   - This sets up `boards`, `columns`, and `cards` tables with Row Level Security (RLS) policies based on `auth.uid()`.
4. Go to **Database → Replication** and enable Realtime for:
   - `boards`
   - `columns`
   - `cards`

---

## 🌐 Netlify Deployment

DarkDesk is pre-configured for seamless deployment on **Netlify** using native Next.js 15 runtime detection.

### Steps to Deploy:
1. Push your repository to GitHub.
2. Import the project into [Netlify](https://app.netlify.com).
3. Under **Site Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy! Netlify automatically handles Next.js SSR and static optimizations via `netlify.toml`.

Live URL: **[https://darkdesk.netlify.app](https://darkdesk.netlify.app)**

---

## 🛠️ Architecture & Tech Stack

| Technology | Role |
|---|---|
| **Next.js 15** | App Router, React Server Components, Client State |
| **React 19** | UI Rendering & Custom State Hooks |
| **TypeScript** | Type-safe domain models & database contracts |
| **Supabase** | PostgreSQL Database, Realtime Subscriptions & Auth |
| **Lucide React** | Clean, accessible icon system |
| **Vitest** | Unit testing for seed data & domain utilities |

```
DarkDesk-KanBan/
├── app/                  # Next.js App Router (pages & layout)
│   ├── login/            # Authentication page
│   └── page.tsx          # Main entrypoint
├── components/           # Core shared UI (AuthProvider, Logo)
├── database/             # Supabase schema & RLS policies (schema.sql)
├── features/kanban/      # Board workspace, columns, cards, and modals
├── hooks/                # Custom hooks (useWorkspace with Realtime & polling)
└── lib/                  # Sync engine, local storage, seed data & helpers
```

---

## 🧪 Testing & Verification

Run the test suite and type checking locally:

```bash
# Run Unit Tests
npm run test

# Type Checking
npm run typecheck

# Production Build Test
npm run build
```
