@echo off
echo Starting DGHSS 360 in DEMO MODE...

echo Resetting demo data to pristine state...
cd backend
call npm run demo:reset
cd ..

echo Starting Backend Server...
start cmd /k "cd backend && set APP_MODE=demo && npm run demo"

echo Starting Admin Frontend...
start cmd /k "cd frontend && set VITE_APP_MODE=demo && npm run dev"

echo Starting Student Frontend...
start cmd /k "cd student-frontend && set VITE_APP_MODE=demo && npm run dev -- --port 5174"

echo Demo environments starting...
echo Admin Portal: http://localhost:5173
echo Student Portal: http://localhost:5174
