# XenoPulse FastAPI CRM Backend Deployment Guide

Follow these steps to deploy the FastAPI CRM backend to Render with persistent SQLite database storage.

---

## Step 1: Push Code to a Git Provider
To deploy on Render, your codebase must be hosted on a Git provider (such as GitHub or GitLab).

1. Initialize Git in the project root directory (`e:\Xeno-Assisgenement`):
   ```bash
   git init
   ```
2. Add a `.gitignore` in the root (excluding local SQLite databases like `sql_app.db`, temporary folders, virtual environments, and `.env` files):
   ```
   # Python
   __pycache__/
   *.pyc
   *.pyo
   *.pyd
   .venv/
   venv/
   env/
   
   # Databases
   backend/sql_app.db
   backend/app/sql_app.db
   
   # Environment files
   .env
   backend/.env
   channel-service/.env
   frontend/.env
   frontend/.env.local
   
   # Node
   node_modules/
   .next/
   dist/
   ```
3. Stage and commit your files, including the root [render.yaml](file:///e:/Xeno-Assisgenement/render.yaml) and the `backend/` directory:
   ```bash
   git add .
   git commit -m "chore: prepare for render deployment"
   ```
4. Create a repository on GitHub/GitLab and push your main branch:
   ```bash
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Connect and Configure Render Web Service (Free Tier)
Since Render Blueprints require paid instances for persistent volumes/disks, you can deploy the CRM Backend as a manual **Web Service** on Render's **Free Tier**.

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click the **"New +"** button in the top navigation bar and select **"Web Service"**.
3. Under **"Connect a repository"**, select your pushed GitHub repository.
4. Configure the Web Service Settings:
   * **Name**: `xenopulse-crm-backend`
   * **Language**: `Python`
   * **Branch**: `main`
   * **Root Directory**: `backend` (This runs commands inside the `backend/` directory)
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port 10000`
   * **Instance Type**: Select **"Free"**
5. Expand the **"Advanced"** settings block and click **"Add Environment Variable"** to add:
   * **`GEMINI_API_KEY`**: Your Google Gemini developer API Key.
   * **`SECRET_KEY`**: Any secret string (e.g. `xenopulse_super_secret_jwt_key_2026`).
   * **`DATABASE_URL`**: `sqlite:///./sql_app.db` (Local SQLite file inside the ephemeral container).
   * **`PYTHONPATH`**: `.`
6. Click **"Create Web Service"** to start building.

---

## Step 3: Seed the DTC Ecommerce Database
Because the Free Tier uses local ephemeral container storage, the SQLite database is initialized fresh on every deployment or service restart.

1. Once the `xenopulse-crm-backend` status changes to a green **"Live"**:
2. Select the `xenopulse-crm-backend` service in your dashboard.
3. Click the **"Shell"** tab in the left sidebar menu.
4. Run the database seeding command in the terminal prompt:
   ```bash
   python -m app.seed
   ```
5. This will populate your SQLite database with exactly **1,000 customers**, **5,000 orders**, and initial administrator accounts.
   *(Note: Remember to run this seeding command if the service restarts and the database is cleared)*

---

## Step 4: Deploy Vite React SPA Frontend to Vercel
Vercel is the recommended hosting platform for static client SPAs.

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **"Add New..."** and select **"Project"**.
3. Import your GitHub repository.
4. Configure the Project Build Settings:
   * **Framework Preset**: Vite
   * **Root Directory**:
     * **Monorepo Build**: Leave as `.` (our root [vercel.json](file:///e:/Xeno-Assisgenement/vercel.json) will automatically direct Vercel to build the `frontend` folder).
     * **Subdirectory Build**: Set Root Directory to `frontend/`.
5. Configure Environment Variables:
   * Add a new environment variable:
     * **Key**: `NEXT_PUBLIC_API_URL`
     * **Value**: Your Render FastAPI backend service URL (e.g. `https://xenopulse-crm-backend.onrender.com`).
6. Click **"Deploy"** and wait for Vercel to generate your static build.
7. Access your dashboard at the generated Vercel domain!

