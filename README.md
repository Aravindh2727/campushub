# CampusHub (EduSphere 360)

CampusHub is a comprehensive Education Management Platform designed to streamline operations for administrators, teachers, and students. 

This repository contains the complete application, structured into three main components:
1. **Backend** (Node.js/Express) - The core API and data management layer.
2. **Admin/Teacher Frontend** (React/Vite) - The portal for school staff to manage students, attendance, homework, and reports.
3. **Student Frontend** (React/Vite) - The dedicated portal for students to view their assignments, marks, circulars, and attendance.

---

## 🚀 Live Demo URLs (Render)

*(Add your deployed Render URLs here once they are live!)*
- **Admin/Teacher Portal**: `https://your-frontend-url.onrender.com`
- **Student Portal**: `https://your-student-url.onrender.com`
- **Backend API**: `https://your-backend-url.onrender.com`

### Demo Credentials
- **Admin**: `admin@demo.com` / `Demo@123`
- **Teacher**: `teacher@demo.com` / `Demo@123`
- **Student**: `DEMO001` / `15052012`

---

## 🛠️ Running Locally (Demo Mode)

The application includes a fully isolated **Demo Mode** which uses local JSON files instead of a MongoDB database or Firebase Authentication. This makes it incredibly easy to test and preview the app without complex setups.

### 1. Start the Backend
```bash
cd backend
npm install
npm run demo
```
*(Runs on `http://localhost:5000`)*

### 2. Start the Admin/Teacher Frontend
```bash
cd frontend
npm install
npm run dev
```
*(Runs on `http://localhost:5173`)*

### 3. Start the Student Frontend
```bash
cd student-frontend
npm install
npm run dev
```
*(Runs on `http://localhost:5174`)*

### Resetting Demo Data
If you want to clear all your modifications and reset the demo data back to its original state, run:
```bash
cd backend
npm run demo:reset
```

---

## ☁️ Deploying to Render

This repository is already configured with a GitHub Actions workflow (`.github/workflows/render-deploy.yml`) that automatically deploys updates when you push to the `main` branch. 

To set up the services in Render for the first time:

### Backend (Web Service)
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:** `APP_MODE` = `demo`

### Admin/Teacher Frontend (Static Site)
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:** `VITE_APP_MODE` = `demo`

### Student Frontend (Static Site)
- **Root Directory:** `student-frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:** `VITE_APP_MODE` = `demo`

---

## 🔒 Production Architecture
In production environments (when `APP_MODE` is not set to `demo`), the application uses **MongoDB** and **Firebase Auth**. The Demo Mode completely isolates and disables these production systems to ensure safe and standalone testing.
