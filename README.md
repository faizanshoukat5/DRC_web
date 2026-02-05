# Diabetic Retinopathy Detection and Stage Classification (RetinaAI) - Web Application

 A full-stack web platform for diabetic retinopathy (DR) screening and stage classification. Built for clinicians and patients with AI-powered fundus image analysis, explainable heatmaps, and comprehensive scan history tracking.

---

##  Features

- **AI-Powered Detection**: Upload fundus images and receive DR severity classification with confidence scores
- **Explainable AI**: Visual heatmaps highlight areas of concern for clinical validation
- **Role-Based Access**: Separate dashboards for administrators, doctors, and patients
- **Doctor-Patient Workflow**: Doctors upload scans for assigned patients; patients view their results
- **Secure Storage**: All scans and reports stored securely via Supabase with Row Level Security (RLS)
- **PDF Reports**: Downloadable reports with scan images, severity grades, and AI confidence scores
- **Admin Panel**: Approve doctor registrations and manage platform users

---

##  Table of Contents

- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Security & RLS](#-security--rls)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

##  Tech Stack

**Frontend:**
- React 19 with TypeScript
- Vite (build tool)
- TailwindCSS + shadcn/ui components
- React Query for data fetching
- React Router for navigation

**Backend:**
- Node.js + Express
- Supabase (PostgreSQL + Auth + Storage)
- Service role for privileged operations

**AI/ML:**
- Fundus image analysis (model integration ready)
- Heatmap generation for explainability

---

##  Prerequisites

- **Node.js** 18+ (with npm)
- **Git**
- **Supabase account** (free tier works)
- **Supabase CLI** (optional but recommended): `npm install -g supabase`

---

##  Installation

### 1. Clone the repository

```bash
git clone https://github.com/faizanshoukat5/DRC_web.git
cd DRC_web
```

### 2. Install dependencies

```bash
npm install
```

This installs all dependencies for both the client and server.

---

##  Environment Setup

You need to configure environment variables for both the **client** and **server**.

### Client Environment Variables

Create `client/.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

### Server Environment Variables

Create `server/.env` (or set in your deployment environment):

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3000
```

** Security Warning:** Never commit your `SUPABASE_SERVICE_ROLE_KEY` to version control. Add `.env` to `.gitignore`.

---

##  Database Setup

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project. Note your project URL and keys.

### 2. Apply Database Migrations

The `supabase/migrations/` folder contains all SQL migrations to set up your database schema.

**Option A: Using Supabase CLI (Recommended)**

```bash
# Link your local project to your Supabase project
npx supabase link --project-ref your_project_ref

# Push all migrations
npx supabase db push
```

**Option B: Manual SQL Execution**

Copy and run each migration file in order via the Supabase Dashboard  SQL Editor:

1. `20251213113312_create_scans_table.sql`
2. `20251213170500_add_profiles.sql`
3. `20251216151908_add_service_role_to_profiles.sql`
4. `20251219000000_add_doctor_patient_relationships.sql`
5. `20260128000000_add_admin_rls_policies.sql`

### 3. Enable Storage Bucket

Create a storage bucket named `fundus_images` in your Supabase project:

1. Go to **Storage** in Supabase Dashboard
2. Create new bucket: `fundus_images`
3. Set appropriate policies (public read or authenticated read depending on requirements)

---

##  Running the Application

### Development Mode

#### 1. Start the backend server

```bash
npm run dev
```

This starts the Express server (default: `http://localhost:3000`) and Vite dev server (default: `http://localhost:5173`).

The dev script runs both server and client concurrently.

#### 2. Access the application

Open your browser to:

```
http://localhost:5173
```

### Production Build

```bash
# Build the client
npm run build

# Start production server
npm start
```

The server will serve the built client from `dist/public`.

---

##  Project Structure

```
DRC_web/
 client/                 # React frontend
    src/
       components/    # UI components (shadcn/ui)
       pages/         # Page components
       hooks/         # Custom React hooks
       lib/           # API client, utils, Supabase config
       main.tsx       # Entry point
    index.html
    public/            # Static assets
 server/                # Express backend
    index.ts           # Server entry
    routes.ts          # API routes
    storage.ts         # Supabase storage helpers
    supabaseClient.ts  # Service role client
 shared/                # Shared TypeScript types
    schema.ts          # Database schema types
 supabase/              # Database migrations
    config.toml
    migrations/
 docs/                  # Documentation
 script/                # Build scripts
 package.json
 tsconfig.json
 vite.config.ts
```

---

##  API Endpoints

The Express server (`server/routes.ts`) provides privileged endpoints that use the service role:

- `GET /api/admin/pending-doctors` - List doctors pending approval (admin only)
- `POST /api/admin/approve-doctor/:id` - Approve a doctor registration
- `GET /api/scans` - List scans (with RLS filtering)
- `POST /api/upload` - Upload fundus images to storage

See `server/routes.ts` for full endpoint documentation.

---

##  Security & RLS

### Row Level Security (RLS)

All database tables have RLS policies to ensure data isolation:

- **Patients** can only view their own scans
- **Doctors** can view scans for their assigned patients
- **Admins** have elevated permissions via `is_admin()` helper function

### Admin RLS Policy

The migration `20260128000000_add_admin_rls_policies.sql` creates:

1. An `is_admin()` SQL function that checks if the current user has `role = 'admin'`
2. RLS policies allowing admins to SELECT and UPDATE the `profiles` table

### Best Practices

- **Never expose service role key** to client code
- Use the **anon key** in client environments
- Leverage **server endpoints** for privileged operations
- Validate user roles on the backend before performing sensitive actions

---

##  Deployment

### Deploy to Vercel/Netlify (Frontend + Serverless Functions)

1. Push to GitHub
2. Connect your repo to Vercel/Netlify
3. Set environment variables in deployment settings
4. Deploy

### Deploy to VPS (Full-stack)

```bash
# Build the app
npm run build

# Run with PM2 or similar
pm2 start server/index.js --name drc-web
```

### Supabase Setup

Ensure your Supabase project is in production mode with:
- All migrations applied
- Storage bucket configured
- Auth providers enabled
- API keys secured

---

##  Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow existing code structure and naming conventions
- Add comments for complex logic
- Test your changes locally before submitting PR

---

##  Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **React Query**: https://tanstack.com/query/latest
- **shadcn/ui**: https://ui.shadcn.com
- **TailwindCSS**: https://tailwindcss.com

---

##  License

This project is for educational and research purposes. Please ensure compliance with healthcare data regulations (HIPAA, GDPR, etc.) when deploying in production.

---

##  Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Last Updated:** February 2026
