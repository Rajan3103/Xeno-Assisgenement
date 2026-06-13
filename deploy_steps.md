# XenoPulse CRM — Complete Deployment Guide (Railway + Vercel)

This guide takes you from zero to a fully running production deployment with:
- **Backend**: Railway (FastAPI + PostgreSQL)
- **Frontend**: Vercel (React/Vite SPA)

---

## Prerequisites
- GitHub repository: `https://github.com/Rajan3103/Xeno-Assisgenement`
- Railway account: https://railway.app
- Vercel account: https://vercel.com
- Railway PostgreSQL database already provisioned (URL: `postgresql://postgres:***@thomas.proxy.rlwy.net:27897/railway`)

---

## PART 1: Deploy Backend on Railway

### Step 1 — Create a New Railway Project

1. Log in at [railway.app](https://railway.app).
2. Click **"New Project"** → **"Deploy from GitHub repo"**.
3. Select the repository `Rajan3103/Xeno-Assisgenement`.
4. Railway will auto-detect the `railway.json` file in the root.

### Step 2 — Configure Service Settings

1. Click on the created service in the Railway canvas.
2. Go to **Settings** tab:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Go to **Variables** tab and add the following:

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:kQyYwPBLpsQSbMUbOjrmLfkeBraYjLob@thomas.proxy.rlwy.net:27897/railway` |
| `SECRET_KEY` | `xenopulse-production-secret-key-2026` (any long random string) |
| `GEMINI_API_KEY` | *Your Google Gemini API Key* |
| `PYTHONPATH` | `.` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `11520` |
| `CHANNEL_SERVICE_URL` | *Leave blank or add your channel service URL if deployed* |

> **Important**: `DATABASE_URL` must be the full `postgresql://` (not `postgres://`) URL.
> The backend code automatically handles both prefixes.

### Step 3 — Deploy

1. Click **"Deploy"** to trigger the first build.
2. Watch the **Build Logs** — you should see:
   ```
   pip install -r requirements.txt ✓
   ```
3. Watch the **Deploy Logs** — you should see:
   ```
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:<PORT>
   ```
4. The backend auto-seeds the PostgreSQL database with 1,000 customers on first startup.

### Step 4 — Verify Backend

Once deployed, open the Railway URL in your browser:
- `https://<your-backend>.up.railway.app/` → Should return `{"message": "Welcome to XenoPulse CRM Backend"}`
- `https://<your-backend>.up.railway.app/health` → Should return `{"status": "healthy"}`
- `https://<your-backend>.up.railway.app/api/v1/openapi.json` → Full OpenAPI spec

---

## PART 2: Deploy Frontend on Vercel

### Step 5 — Create Vercel Project

1. Log in at [vercel.com](https://vercel.com).
2. Click **"Add New"** → **"Project"**.
3. Import the `Rajan3103/Xeno-Assisgenement` GitHub repository.
4. Vercel auto-detects `vercel.json` in the root.

### Step 6 — Configure Vercel Settings

In the **Configure Project** screen:
- **Framework Preset**: Vite
- **Root Directory**: Leave as `/` (root — vercel.json handles build paths)
- **Build Command**: `npm run build --prefix frontend`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install --prefix frontend`

### Step 7 — Add Environment Variable (Critical!)

In **Environment Variables**, add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-backend-service>.up.railway.app` |

> **This is the most critical step.** Without this variable pointing to your Railway backend URL,
> the frontend sends API requests to its own Vercel domain → gets 404 errors → shows
> **"Invalid credentials"** on login. Always set this before deploying.

### Step 8 — Deploy

1. Click **"Deploy"**.
2. Wait for the build to complete.
3. Open your Vercel production URL.

---

## PART 3: Verify the Full Stack

### Step 9 — Test Login

1. Navigate to your Vercel URL (e.g., `https://xeno-assisgenement.vercel.app`).
2. You should see the **XenoPulse Login Screen**.
3. Click **"Admin Space"** to autofill admin credentials:
   - Email: `admin@xenopulse.com`
   - Password: `admin123`
4. Click **"Authorize Workspace"** → Should load the **Insights Engine dashboard**.

5. Log out and click **"Manager Space"**:
   - Email: `manager@xenopulse.com`
   - Password: `manager123`
6. Click **"Authorize Workspace"** → Should load the **AI Command Center dashboard**.

### Step 10 — Troubleshooting

| Error Shown | Cause | Fix |
|---|---|---|
| `"Invalid credentials. Please try again."` | Wrong email/password | Use exact: `admin@xenopulse.com` / `admin123` |
| `"Backend server error (500/503)"` | Railway backend is offline | Check Railway deploy logs; verify `$PORT` is used |
| `"Backend server error (500)"` on login | `DATABASE_URL` is wrong | Verify Postgres URL in Railway Variables |
| `"Backend server error (404)"` | Wrong API URL on frontend | Verify `NEXT_PUBLIC_API_URL` in Vercel env vars |
| Dashboard loads but shows empty data | Seeding failed | Check Railway logs for seed script errors |

---

## Default Credentials

| Role | Email | Password | Default View |
|---|---|---|---|
| Admin | `admin@xenopulse.com` | `admin123` | Insights Engine |
| Admin (alt) | `admin@xenopulse.ai` | `admin123` | Insights Engine |
| Marketing Manager | `manager@xenopulse.com` | `manager123` | AI Command Center |

---

## Environment Variables Summary

### Railway Backend
```
DATABASE_URL=postgresql://postgres:kQyYwPBLpsQSbMUbOjrmLfkeBraYjLob@thomas.proxy.rlwy.net:27897/railway
SECRET_KEY=xenopulse-production-secret-key-2026
GEMINI_API_KEY=<your-key>
PYTHONPATH=.
ACCESS_TOKEN_EXPIRE_MINUTES=11520
```

### Vercel Frontend
```
NEXT_PUBLIC_API_URL=https://<your-backend-service>.up.railway.app
```
