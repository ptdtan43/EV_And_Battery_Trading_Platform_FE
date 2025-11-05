@echo off
echo Killing process on port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /F /PID %%a
)
echo Done! Now restart dev server with: npm run dev
pause

