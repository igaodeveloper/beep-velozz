@echo off
echo Fixing Gradle build issues for Beep Velozz...

echo.
echo 1. Cleaning Gradle cache...
cd /d "%~dp0\android"
if exist .gradle rmdir /s /q .gradle
if exist build rmdir /s /q build
if exist app\build rmdir /s /q app\build

echo.
echo 2. Cleaning Metro cache...
cd /d "%~dp0"
npx expo start --clear
timeout /t 2 >nul

echo.
echo 3. Resetting and reinstalling dependencies...
if exist node_modules rmdir /s /q node_modules
npm install

echo.
echo 4. Running prebuild to regenerate Android project...
npx expo prebuild --clean

echo.
echo 5. Building Android release...
cd /d "%~dp0\android"
gradlew assembleRelease

echo.
echo Build process completed!
pause
