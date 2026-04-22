@echo off
echo Building APK for Beep Velozz...
echo.

REM Clean previous builds
echo Cleaning previous builds...
call gradlew clean
if %ERRORLEVEL% neq 0 (
    echo Error cleaning previous builds
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
npm install
if %ERRORLEVEL% neq 0 (
    echo Error installing dependencies
    pause
    exit /b 1
)

REM Prebuild to generate native files
echo Running prebuild...
npx expo prebuild --platform android --clean
if %ERRORLEVEL% neq 0 (
    echo Error running prebuild
    pause
    exit /b 1
)

REM Build release APK
echo Building release APK...
cd android
call gradlew assembleRelease
if %ERRORLEVEL% neq 0 (
    echo Error building APK
    cd ..
    pause
    exit /b 1
)

cd ..

REM Copy APK to project root
echo Copying APK to project root...
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    copy "android\app\build\outputs\apk\release\app-release.apk" "beep-velozz-release.apk"
    echo APK built successfully: beep-velozz-release.apk
) else (
    echo APK file not found
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo APK location: beep-velozz-release.apk
pause
