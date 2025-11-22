@echo off
echo Starting Ayurvedic Diet Application Servers...

REM Start backend server in a new window
start "Backend Server" cmd /k "cd /d %~dp0server && npm start"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start frontend in a new window
start "Frontend Server" cmd /k "cd /d %~dp0client && npm start"

echo Servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Use these credentials to login:
echo Email: doctor@ayurcare.com
echo Password: Test@123

exit
