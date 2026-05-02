# Hosting BudgetMinds

This guide covers the simplest way to deploy the `BudgetMinds` application to the internet for free. 

The application consists of two parts:
1. **Frontend**: React + Vite (Best hosted on Vercel or Netlify)
2. **Backend**: FastAPI + Python (Best hosted on Render or Railway)

---

## 1. Hosting the Backend (FastAPI) on Render

Render is a great platform for hosting Python APIs.

### Prerequisites:
- Push your entire `BudgetMinds` folder to a GitHub repository.
- Ensure you have a `requirements.txt` file in your `backend` folder. If you don't, you can generate it by running: `pip freeze > requirements.txt` inside the backend folder.

### Deployment Steps:
1. Go to [Render.com](https://render.com/) and create a free account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your `BudgetMinds` repository.
4. Configure the Web Service:
   - **Name**: `budgetminds-api` (or similar)
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables**:
   - You **MUST** add your `GOOGLE_API_KEY` (Your Gemini API key) under the "Environment" tab.
   - For the Firebase Admin SDK (`budgetminds-7cbbc-firebase-adminsdk...json`), upload the JSON file securely, or better yet, convert it to environment variables (Render allows uploading secret files under "Secret Files").
6. **Important Note on SQLite Database**: Render uses ephemeral disk space on free tiers, meaning every time you deploy an update, your `sqlite.db` will be wiped! For production, you should upgrade to Render's free PostgreSQL database.
7. Click **Create Web Service**. Render will give you a public URL (e.g., `https://budgetminds-api.onrender.com`).

---

## 2. Hosting the Frontend (React) on Vercel

Vercel is the easiest and fastest way to host React applications.

### Deployment Steps:
1. First, inside `frontend/src/services/api.ts`, change your `API_BASE_URL` from `http://localhost:8000/api` to your new Render Backend URL:
   ```typescript
   const API_BASE_URL = 'https://budgetminds-api.onrender.com/api';
   ```
2. Push this change to your GitHub repository.
3. Go to [Vercel.com](https://vercel.com/) and sign up with GitHub.
4. Click **Add New... > Project**.
5. Import your `BudgetMinds` repository.
6. Configure the Project:
   - **Project Name**: `budgetminds-app`
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
7. Click **Deploy**. Vercel will automatically run `npm install` and `npm run build`, and then provide you with a live, public URL!

---

## 3. Updating Firebase Authorized Domains

Your frontend is now live on Vercel (e.g., `https://budgetminds-app.vercel.app`), but Firebase Authentication will block logins from this new URL for security.

1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Select your `budgetminds` project.
3. Go to **Authentication** > **Settings** > **Authorized domains**.
4. Click **Add domain** and paste your new Vercel URL (e.g., `budgetminds-app.vercel.app`). Do not include the `https://` prefix.
5. Your login system is now fully functional on the live web!

---

## Final Checklist
- [ ] Backend is live on Render and returning `200 OK`.
- [ ] Frontend `api.ts` is updated to point to the Render URL.
- [ ] Frontend is live on Vercel.
- [ ] Vercel URL is added to Firebase Authorized Domains.
- [ ] The application is fully ready!
