# Verify Gradle fixes for Beep Velozz
Write-Host "Verifying Gradle configuration fixes..." -ForegroundColor Green

# Check if settings.gradle has the correct autolinking path
$settingsGradle = Get-Content "android\settings.gradle" -Raw
if ($settingsGradle -match "scripts/android/autolinking_implementation.gradle") {
    Write-Host "✓ Autolinking script path fixed in settings.gradle" -ForegroundColor Green
} else {
    Write-Host "✗ Autolinking script path not fixed" -ForegroundColor Red
}

# Check if build.gradle uses compilerOptions instead of kotlinOptions
$buildGradle = Get-Content "android\build.gradle" -Raw
if ($buildGradle -match "compilerOptions" -and $buildGradle -notmatch "kotlinOptions") {
    Write-Host "✓ Kotlin compilerOptions updated in build.gradle" -ForegroundColor Green
} else {
    Write-Host "✗ Kotlin compilerOptions not properly updated" -ForegroundColor Red
}

# Check Expo modules compatibility
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$expoVersion = $packageJson.dependencies.expo -replace '[^0-9.]'
if ([version]$expoVersion -ge [version]"54.0.0") {
    Write-Host "✓ Expo SDK version is compatible: $expoVersion" -ForegroundColor Green
} else {
    Write-Host "⚠ Expo SDK version might be outdated: $expoVersion" -ForegroundColor Yellow
}

# Check gradle.properties
$gradleProps = Get-Content "android\gradle.properties" -Raw
if ($gradleProps -match "newArchEnabled=true") {
    Write-Host "✓ New Architecture enabled" -ForegroundColor Green
}
if ($gradleProps -match "hermesEnabled=true") {
    Write-Host "✓ Hermes engine enabled" -ForegroundColor Green
}
if ($gradleProps -match "EXPO_USE_COMMUNITY_AUTOLINKING=0") {
    Write-Host "✓ Expo autolinking configured" -ForegroundColor Green
}

Write-Host "`nConfiguration verification complete!" -ForegroundColor Cyan
Write-Host "To build the app, run:" -ForegroundColor Yellow
Write-Host "1. .\scripts\setup-java-windows.bat" -ForegroundColor White
Write-Host "2. .\scripts\build-android-windows.bat" -ForegroundColor White
