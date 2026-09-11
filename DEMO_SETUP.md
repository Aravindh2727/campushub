# EduSphere 360 - Demo Mode Setup Guide

This guide explains how to start and use the safely isolated, offline Client Demo version of EduSphere 360.

## Overview
The application now includes a completely isolated `DEMO MODE`.
When active, it **completely bypasses MongoDB and Firebase Authentication**, utilizing local JSON file storage (`backend/demo-data/`) to simulate a live database. 

This ensures that:
1. You do not need an internet connection.
2. You do not need MongoDB installed.
3. No production data is ever loaded, modified, or exposed.

---

## 🚀 How to Start the Demo

We have provided a convenient batch script to start all services simultaneously in Demo Mode.

1. Open your terminal or file explorer in the root project directory (`EduSphere 360`).
2. Run the startup script:
   ```cmd
   start-demo.bat
   ```
3. This will launch 3 command prompt windows:
   - Backend Server (Port 5000)
   - Admin/Teacher Portal (Port 5173)
   - Student Portal (Port 5174)

Alternatively, you can run them manually with the environment variables:
- Backend: `set APP_MODE=demo && npm run demo`
- Admin Frontend: `set VITE_APP_MODE=demo && npm run dev`
- Student Frontend: `set VITE_APP_MODE=demo && npm run dev -- --port 5174`

---

## 🔑 Demo Credentials

Use these fictional credentials to test the application offline.

### Admin Portal (`http://localhost:5173`)
- **Email:** `admin@demo.com`
- **Password:** `Demo@123`

### Teacher Portal (`http://localhost:5173`)
- **Email:** `teacher@demo.com`
- **Password:** `Demo@123`
*(Note: There are 8 pre-configured teachers. `maths.teacher@demo.com`, `science.teacher@demo.com`, etc., all share the same password `Demo@123`).*

### Student Portal (`http://localhost:5174`)
- **EMIS / Phone Number:** `DEMO001`
- **Password (DOB):** `15052012`

---

## 🔄 How to Reset Demo Data

Any changes made during a demo session (e.g., adding homework, marking attendance) are saved locally to JSON files so the demo remains consistent across page reloads.

To reset the demo back to its pristine, original state:

1. Open a terminal in the `backend` folder.
2. Run the reset command:
   ```cmd
   npm run demo:reset
   ```
This will instantly wipe any modifications and restore the original fictional sample data.

---

## ⚠️ Important Safety Notes

- **Never** manually copy real user data into the `demo-data/` or `demo-data-template/` folders.
- Production Mode is completely untouched. To run in production, simply run `node server.js` and `npm run dev` without the `APP_MODE=demo` or `VITE_APP_MODE=demo` variables.
