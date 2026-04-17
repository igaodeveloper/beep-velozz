@echo off
echo Setting up Java environment for Android builds on Windows...

REM Check if Java is already installed
java -version >nul 2>&1
if %errorlevel% == 0 (
    echo Java is already installed
    java -version
    goto :set_env
)

echo Java not found. Please install Java 17 or higher:
echo 1. Download from: https://adoptium.net/temurin/releases/?version=17
echo 2. Or install using Chocolatey: choco install temurin17
echo 3. Or install using Scoop: scoop install openjdk17
echo.
echo After installation, run this script again.
pause
exit /b 1

:set_env
REM Set JAVA_HOME environment variable
for /f "tokens=*" %%i in ('where java') do set JAVA_PATH=%%i
set JAVA_HOME=%JAVA_PATH%\..
echo JAVA_HOME set to: %JAVA_HOME%

REM Add to PATH if not already there
echo %PATH% | findstr /i "%JAVA_HOME%" >nul
if %errorlevel% == 1 (
    echo Adding Java to PATH...
    set PATH=%JAVA_HOME%;%PATH%
)

echo Java environment setup complete!
echo Testing Gradle build...
cd /d "%~dp0..\android"
gradlew.bat --version
if %errorlevel% == 0 (
    echo Gradle is working correctly!
    echo You can now run: gradlew.bat assembleRelease
) else (
    echo Gradle setup failed. Please check your installation.
)
pause
