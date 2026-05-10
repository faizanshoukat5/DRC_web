# AEYE — AI-Guided Retinal Screening (Web Platform)

AEYE is a clinical web application for diabetic retinopathy (DR) screening. Doctors upload fundus photographs, an EfficientNet-B4 model grades severity across five levels (No DR → Proliferative), and results are displayed alongside Grad-CAM heatmaps with a multi-colormap toggle. Progression alerts compare the current scan against the patient's previous visit and surface worsening or improvement automatically.

---

## Features

- **DR grading** — 5-class severity via temperature-calibrated EfficientNet-B4 with confidence scores
- **Grad-CAM heatmaps** — 5 colormaps (Turbo, Inferno, Jet, Viridis, Magma); Turbo + Inferno pre-rendered at inference time, rest fetched on-demand via `/recolor`
- **Progression alerts** — rule-based red/green banner on the results page when DR worsens or improves vs. the patient's prior scan
- **Scan history trend badges** — Worsened / Improved / Stable / New color-coded pill per row in the history list
- **Multi-role auth** — Patient, Doctor, Admin via Supabase magic-link email
- **PDF reports** — downloadable per-scan clinical summary
- **Follow-up scheduling** — doctors set follow-up dates; patients see reminders on their dashboard
- **Dual-model support** — AEYE v1 (calibrated) + optional partner model; model picker surfaces when both URLs are configured

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Routing | Wouter |
| Backend | Node.js 20, Express (ESM), TypeScript |
| Database / Auth | Supabase (Postgres + Row-Level Security + Magic-Link) |
| ORM / Migrations | Drizzle ORM |
| PDF | jsPDF |

---

## Project Structure

```
├── client/               # React + Vite frontend
│   └── src/
│       ├── pages/        # Route components (dashboards, results, history, …)
│       ├── components/   # Shared UI (web-layout, shadcn/ui primitives)
│       ├── hooks/        # useAuth, …
│       └── lib/          # api.ts, progression.ts, supabaseClient.ts
├── server/               # Express backend
│   ├── index.ts          # Entry point
│   ├── routes.ts         # REST endpoints
│   ├── mlClient.ts       # ML backend proxy (AEYE v1 + partner model)
│   ├── storage.ts        # Supabase Storage helpers
│   └── supabaseClient.ts # Admin client (service role)
├── shared/               # Types shared by client + server
└── supabase/             # SQL migrations
```

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- ML backend URL — Hugging Face Space or any FastAPI deployment

---

## Installation

```bash
git clone https://github.com/faizanshoukat5/DRC_web.git
cd DRC_web
npm install
```

---

## Environment Variables

Create two files in the project root (see `.env.example` for reference).

**`.env`** — Vite client (safe to expose to the browser):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**`.env.server`** — Express server (keep secret, never commit):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgres://user:password@host:5432/database
PORT=3000

# AEYE ML backend (required for predictions)
DR_API_URL=https://faizan055-dr-classifier.hf.space
DR_API_KEY=hf_xxxxxxxxxxxxxxxxxxxx

# Optional partner model — leave unset to hide the model picker
DR_API_URL_PARTNER=https://hissanzahir-dr-detection-api.hf.space
```

> `SUPABASE_SERVICE_ROLE_KEY` bypasses Row-Level Security. Never expose it in the browser or commit it to version control.

---

## Local Development

```bash
npm run db:push   # apply schema to Supabase
npm run dev       # Express + Vite HMR on http://localhost:3000
```

---

## Production Build

```bash
npm run build
npm start
```

`npm run build` bundles the React app into `dist/public/` and compiles the server to `dist/index.cjs`. `npm start` serves both from the same Express process.

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **service role key** into `.env.server`.
3. Copy the **anon/public key** into `.env`.
4. Run `npm run db:push` to apply the Drizzle schema.
5. In **Authentication → URL Configuration**, add your deployed domain to *Redirect URLs* so magic-link emails work in production (e.g., `https://yourdomain.com/**`).

---

## ML Backend

The Express server proxies uploaded fundus images to a FastAPI service. The service must expose:

- `POST /predict` — multipart `file` field; returns `class_id`, `class_name`, `confidence`, `probabilities`, `heatmaps_b64` (colormap → base64 PNG dict), `calibrated`, `temperature_used`
- `POST /recolor` — multipart `file` + `colormap` field; returns `heatmap_b64`

Pre-trained weights and the reference FastAPI implementation are at [Hugging Face — faizan055/dr-classifier](https://huggingface.co/spaces/faizan055/dr-classifier).

---

## User Roles

| Role | Capabilities |
|---|---|
| `patient` | View own scans, follow-up schedule, download PDFs |
| `doctor` | Upload scans for assigned patients, write clinical notes, create follow-ups |
| `admin` | View all scans and profiles, approve doctor registrations |

New accounts default to `patient`. Doctors are approved by an admin via the Admin Dashboard or directly in the Supabase profiles table.

---

## Deployment

### cPanel (Node.js Selector)

1. Upload the project to your cPanel home directory.
2. Open **Node.js Selector**, create an app: entry file `dist/index.cjs`, Node.js 20.
3. Set all environment variables in the Selector UI.
4. Run `npm install && npm run build` in the terminal, then restart the app.

### Railway / Render

1. Connect this GitHub repo.
2. Set environment variables in the platform dashboard.
3. Build command: `npm run build`
4. Start command: `npm start`

---

## License

MIT
