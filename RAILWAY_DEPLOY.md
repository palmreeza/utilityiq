# Utility IQ — Railway.app Deployment Guide

## Prerequisites

- A Railway.app account
- A GitHub repository for this project
- A MySQL database (Railway MySQL plugin or PlanetScale)

## Required Environment Variables

Set these in Railway → Project → Variables:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/utility_iq` |
| `JWT_SECRET` | Session signing secret (min 32 chars) | `openssl rand -hex 32` |
| `NODE_ENV` | Runtime environment | `production` |
| `VITE_APP_TITLE` | App name shown in browser | `Utility IQ` |
| `OWNER_OPEN_ID` | OpenID of the first Platform Owner | Your user's OpenID |
| `OWNER_NAME` | Name of the first Platform Owner | `IOT.nxt Admin` |
| `VITE_APP_ID` | OAuth App ID | From your OAuth provider |
| `OAUTH_SERVER_URL` | OAuth backend base URL | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | OAuth login portal URL | `https://manus.im` |

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial Utility IQ build"
   git remote add origin https://github.com/your-org/utility-iq.git
   git push -u origin main
   ```

2. **Create Railway Project**
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
   - Select your repository

3. **Add MySQL Database**
   - In Railway project → Add Service → Database → MySQL
   - Railway will auto-inject `DATABASE_URL`

4. **Set Environment Variables**
   - Go to your service → Variables tab
   - Add all variables from the table above

5. **Run Database Migrations**
   - After first deploy, the app will auto-connect to the database
   - Navigate to `/admin` and click **Seed Default Template** to initialise the assessment template

6. **Configure Custom Domain** (optional)
   - Railway → Settings → Domains → Add custom domain

## Build Configuration

The project uses:
- **Build command:** `pnpm run build`
- **Start command:** `node dist/index.js`
- **Node version:** 22+

Railway detects these automatically via `railway.json` and `package.json`.

## Post-Deployment Setup

1. Sign in as the Platform Owner (your `OWNER_OPEN_ID`)
2. Go to **Admin Panel** → **Seed Default Template**
3. Create your first **Organisation**
4. Create an **Assessment** and start scoring

## Health Check

The app exposes `/api/health` for Railway's health check endpoint.
