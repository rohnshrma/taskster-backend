# Deployment Guide (MERN Todo)

This guide covers full deployment from GitHub:

- Backend: **Render**
- Frontend: **Netlify**
- Database: **MongoDB Atlas (Cloud)**

It includes every major step, from creating separate repos to setting environment variables.

---

## 1. Prerequisites

- Git installed (`git --version`)
- GitHub account
- Render account
- Netlify account
- MongoDB Atlas account
- Node.js installed locally

---

## 2. Create 2 Separate GitHub Repositories

Create these repos on GitHub (empty repos, no README):

- `mern-todo-backend`
- `mern-todo-frontend`

### 2.1 Push backend folder to its own repo

From project root:

```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/mern-todo-backend.git
git push -u origin main
```

### 2.2 Push frontend folder to its own repo

From project root:

```bash
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/mern-todo-frontend.git
git push -u origin main
```

### 2.3 Normal update flow (both repos)

Whenever you change code:

```bash
git add .
git commit -m "describe your change"
git push
```

Run these commands from inside `backend` and `frontend` separately.

---

## 3. MongoDB Atlas Setup (Cloud DB)

### 3.1 Create cluster

1. Log in to MongoDB Atlas.
2. Create a new project (example: `mern-todo`).
3. Create a cluster (free tier is fine).
4. Wait until cluster status is ready.

### 3.2 Create Atlas admin user (database user)

1. Go to **Database Access**.
2. Click **Add New Database User**.
3. Authentication method: Password.
4. Username: choose a strong username (example: `todoAdmin`).
5. Password: generate a strong password and save it safely.
6. Database User Privileges: choose **Atlas admin**.
7. Save user.

### 3.3 Allow access from anywhere

1. Go to **Network Access**.
2. Click **Add IP Address**.
3. Choose **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Confirm.

Note: `0.0.0.0/0` is easiest for deployment. For tighter security later, restrict to known IPs.

### 3.4 Get connection string

1. Go to **Database > Connect > Drivers**.
2. Copy the connection string, looks like:

```text
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

3. Replace placeholders:
- `<username>` = Atlas DB username
- `<password>` = Atlas DB password

4. Add DB name at the end if needed:

```text
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mern_todo?retryWrites=true&w=majority
```

Use this final value as your `MONGO_URI` in Render.

---

## 4. Deploy Backend on Render

### 4.1 Create Web Service

1. Open Render dashboard.
2. Click **New +** > **Web Service**.
3. Connect GitHub and select `mern-todo-backend` repo.
4. Fill settings:
- Name: `mern-todo-backend` (or any name)
- Environment: `Node`
- Branch: `main`
- Build Command: `npm install`
- Start Command: `npm start`

### 4.2 Add backend environment variables (Render)

In Render service settings, add:

- `PORT` = `10000` (Render also injects PORT automatically; this is optional)
- `MONGO_URI` = your Atlas connection string
- `CLIENT_URL` = `https://<your-netlify-site>.netlify.app`

If you have multiple frontend domains, use comma-separated values:

```text
CLIENT_URL=https://<your-netlify-site>.netlify.app,http://localhost:5173
```

Save changes and deploy.

### 4.3 Verify backend

After deploy success, open:

```text
https://<your-render-service>.onrender.com/api/health
```

You should get:

```json
{"status":"ok"}
```

Your backend base URL becomes:

```text
https://<your-render-service>.onrender.com/api
```

---

## 5. Deploy Frontend on Netlify

### 5.1 Create site from GitHub

1. Open Netlify dashboard.
2. Click **Add new site** > **Import an existing project**.
3. Connect GitHub and select `mern-todo-frontend` repo.
4. Build settings:
- Build command: `npm run build`
- Publish directory: `dist`

### 5.2 Add frontend environment variable (Netlify)

In Netlify site settings > **Environment variables**, add:

- `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`

Trigger a redeploy after adding env vars.

### 5.3 Verify frontend

Open your Netlify URL and test:

- Add todo
- Toggle complete/incomplete
- Edit todo
- Delete todo

If all work, frontend-backend-db integration is successful.

---

## 6. Local .env files (development only)

### backend/.env

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/mern_todo
CLIENT_URL=http://localhost:5173
```

### frontend/.env

```env
VITE_API_URL=http://localhost:5001/api
```

Never push actual `.env` files to GitHub.

---

## 7. CORS and API URL Notes

- Your frontend must call the Render backend URL in production (`VITE_API_URL`).
- If browser requests fail with CORS errors, configure backend CORS to allow your Netlify domain.

Example allowed origin value:

```text
https://your-app-name.netlify.app
```

---

## 8. Deployment Checklist

- [ ] Backend pushed to `mern-todo-backend` repo
- [ ] Frontend pushed to `mern-todo-frontend` repo
- [ ] Atlas cluster created
- [ ] Atlas admin user created
- [ ] Atlas network access set (`0.0.0.0/0`)
- [ ] `MONGO_URI` added in Render
- [ ] Backend health endpoint works on Render
- [ ] `VITE_API_URL` added in Netlify
- [ ] Frontend redeployed on Netlify
- [ ] CRUD works on deployed site

---

## 9. Common Issues and Fixes

1. `MongoServerError: bad auth`
- Username/password in `MONGO_URI` is wrong.
- URL-encode special characters in password.

2. `MongooseServerSelectionError`
- Atlas network access not allowed.
- `0.0.0.0/0` missing or cluster paused.

3. Frontend shows network error
- `VITE_API_URL` missing or incorrect in Netlify.
- Need redeploy after changing environment variables.

4. CORS blocked in browser
- Backend needs CORS config for Netlify domain.

5. Render service sleeps on free plan
- First request may be slow after inactivity.

---

## 10. Recommended Next Hardening Steps

- Restrict Atlas IP access once stable.
- Use least-privilege database user instead of Atlas admin.
- Add HTTPS-only cookie/JWT strategy if authentication is added.
- Add custom domain in Netlify and Render.
