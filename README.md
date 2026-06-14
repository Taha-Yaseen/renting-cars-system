# DriveRent — Car Rental Management

A single-page React application for managing a small car rental business. Built with Vite, Tailwind CSS, and Lucide React icons. Data can be stored in **Supabase** (PostgreSQL) or, without configuration, in the browser via `localStorage`.

## Features

- **Dashboard** — KPI cards (revenue, active rentals, available cars, cars utilization), quick actions, overdue/recent activity table
- **Cars** — Grid view with search/filter, add/edit modals, maintenance toggle
- **Client Directory** — Searchable table with rental history counts, add/edit clients
- **Rental Operations** — Color-coded contracts, new rental workflow with auto cost calculation, return car flow

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Without Supabase env vars, the app runs in local demo mode (mock seed + `localStorage`).

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL** and **anon public** key.
3. Copy `.env.example` to `.env` and set:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. In **SQL Editor**, run `supabase/migrations/001_initial_schema.sql`.
5. Optionally run `supabase/seed.sql` for sample cars data.
6. Restart the dev server (`npm run dev`).

The app loads cars, clients, and rentals from Supabase and persists every change to the database.

> **Security:** The migration includes permissive Row Level Security policies for the anon key (fine for development). Before production, add [Supabase Auth](https://supabase.com/docs/guides/auth) and restrict policies to authenticated users.

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- Lucide React
- Supabase (optional) or localStorage
