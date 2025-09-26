@echo off
echo =====================================
echo 🚀 Brand2Stand Backend Setup Script
echo =====================================

REM Check if backend directory exists
if not exist "backend" (
  echo ❌ Backend directory not found
  echo Please run this script from the project root
  exit /b 1
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install

REM Check if .env file exists
if not exist ".env" (
  echo.
  echo ⚠️  No .env file found in backend/
  echo Creating .env from template...
  
  if exist "env-template.txt" (
    copy env-template.txt .env
    echo ✅ Created backend/.env from template
  ) else (
    echo # Add your API keys here > .env
    echo FAL_API_KEY=your-fal-api-key-here >> .env
    echo OPENAI_API_KEY=your-openai-api-key-here >> .env
    echo PORT=3001 >> .env
    echo FRONTEND_URL=http://localhost:5173 >> .env
    echo ✅ Created basic backend/.env
  )
  
  echo.
  echo 🔴 CRITICAL: Edit backend\.env and add your API keys:
  echo    - FAL_API_KEY
  echo    - OPENAI_API_KEY
  echo.
  pause
)

REM Start the backend server
echo.
echo 🚀 Starting backend server on port 3001...
echo =====================================
call npm start
