# AgriMech Production Deployment Guide

This guide explains how to deploy AgriMech to the cloud. The platform is pre-configured for **three popular deployment methods**:

---

## 🌟 Option 1: Render.com (Recommended - 100% Free, All-in-One)

Render allows you to host the unified application (Angular Frontend + Node/Express Backend) on a **single free Web Service** with zero CORS headaches.

### Steps:
1. **Push your code to GitHub**:
   ```bash
   cd /Users/kunalrajsingh/.gemini/antigravity/scratch/agrimech
   git init
   git add .
   git commit -m "feat: production ready AgriMech platform"
   git remote add origin https://github.com/<your-username>/agrimech.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [https://dashboard.render.com](https://dashboard.render.com) and log in with GitHub.
   - Click **"New +"** &rarr; **"Web Service"**.
   - Select your `agrimech` repository.
   - Configure the service:
     * **Name:** `agrimech`
     * **Environment:** `Node`
     * **Build Command:** `npm run build`
     * **Start Command:** `npm run start`
     * **Instance Type:** `Free`
   - Under **Environment Variables**, add:
     * `NODE_ENV`: `production`
     * `PORT`: `10000`
     * `MONGODB_URI`: `mongodb+srv://kunal123singhraj_db_user:kunal12345@cluster0.yc8lmjw.mongodb.net/agrimech?retryWrites=true&w=majority`
     * `JWT_SECRET`: `agrimech_production_secret_2026`
   - Click **"Deploy Web Service"**.

Render will automatically build the Angular frontend, compile the TypeScript backend, and launch your live application at `https://agrimech.onrender.com`!

---

## ⚡ Option 2: Vercel (Frontend) + Render (Backend)

If you prefer global edge CDN performance for the Angular frontend:

### 1. Deploy Backend on Render:
- Create a Web Service pointing to `backend/`:
  - **Root Directory:** `backend`
  - **Build Command:** `npm install && npm run build`
  - **Start Command:** `npm start`
  - **Environment Variables:** `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`.
  - Your API URL will be: `https://agrimech-api.onrender.com`.

### 2. Deploy Frontend on Vercel:
- Go to [https://vercel.com](https://vercel.com) &rarr; **Add New Project**.
- Import your repository and select the `frontend` folder as the Root Directory.
- **Framework Preset:** `Angular`
- **Build Command:** `npm run build`
- **Output Directory:** `dist/agrimech-frontend/browser`
- In `frontend/src/app/core/config/api.config.ts`, set your production API base URL to `https://agrimech-api.onrender.com/api`.
- Click **Deploy**.

---

## 🐳 Option 3: Docker on any VPS (AWS EC2, DigitalOcean, Linode)

If you have a Linux server or VPS:

1. **Install Docker and Docker Compose on your server.**
2. **Clone the repository on the server**:
   ```bash
   git clone https://github.com/<your-username>/agrimech.git
   cd agrimech
   ```
3. **Launch the container**:
   ```bash
   docker compose up -d --build
   ```
4. AgriMech will be live at `http://your-server-ip:5000`! You can attach a custom domain and SSL using Nginx or Caddy.

---

## 🔒 Security & Environment Checklist
- [x] **MongoDB Atlas**: Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access so cloud servers (Render/Vercel) can connect.
- [x] **JWT Secret**: Ensure `JWT_SECRET` is set in production environment variables.
- [x] **Zero Fake Data**: Preserves live MongoDB Atlas collections.
