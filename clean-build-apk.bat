@echo off
REM Script para fazer clean build do APK com Beep Velozz
REM Este script limpa tudo e reconstrói

echo.
echo ============================================
echo Beep Velozz - Clean Build Script
echo ============================================
echo.

echo [1/5] Removendo node_modules...
rmdir /s /q node_modules 2>nul
if exist node_modules (
    echo ❌ Falha ao remover node_modules, tente manualmente
    exit /b 1
)
echo ✅ node_modules removido

echo.
echo [2/5] Limpando cache do npm...
call npm cache clean --force
echo ✅ Cache npm limpo

echo.
echo [3/5] Removendo .expo...
rmdir /s /q .expo 2>nul
echo ✅ Cache .expo removido

echo.
echo [4/5] Reinstalando dependências...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Falha ao instalar dependências
    exit /b 1
)
echo ✅ Dependências reinstaladas

echo.
echo [5/5] Fazendo clean build do APK...
echo.
call npm run build:android:apk:clean
if %errorlevel% neq 0 (
    echo ❌ Build falhou
    exit /b 1
)

echo.
echo ============================================
echo ✅ Build completado com sucesso!
echo ============================================
echo.
echo Próximos passos:
echo 1. Aguarde EAS completar o build
echo 2. Baixe o APK
echo 3. Instale no dispositivo: adb install -r app-release.apk
echo 4. Teste o aplicativo
echo.
pause
