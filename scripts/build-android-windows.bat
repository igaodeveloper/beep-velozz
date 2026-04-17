@echo off
echo Building Android APK on Windows...

REM Check if we're in the right directory
if not exist "gradlew.bat" (
    echo Error: gradlew.bat not found. Please run this script from the android directory.
    pause
    exit /b 1
)

REM Check Java installation
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Java not found. Please run setup-java-windows.bat first.
    pause
    exit /b 1
)

REM Clean previous builds
echo Cleaning previous builds...
call gradlew.bat clean

REM Build release APK
echo Building release APK...
call gradlew.bat assembleRelease

if %errorlevel% == 0 (
    echo.
    echo Build successful!
    echo APK location: app\build\outputs\apk\release\app-release.apk
    echo.
    echo To install on device:
    echo adb install app\build\outputs\apk\release\app-release.apk
) else (
    echo.
    echo Build failed! Check the error messages above.
    echo Common solutions:
    echo 1. Ensure Java 17+ is installed
    echo 2. Check ANDROID_HOME environment variable
    echo 3. Verify Android SDK installation
    echo 4. Run: gradlew.bat --stacktrace for detailed errors
)

pause
