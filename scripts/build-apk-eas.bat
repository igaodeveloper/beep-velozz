@echo off
echo ========================================
echo Beep Velozz - EAS Build APK Script
echo ========================================
echo.

echo [1/5] Verificando configuracoes...
npx eas whoami
if %errorlevel% neq 0 (
    echo ERRO: Voce nao esta logado no Expo!
    echo Execute: npx eas login
    pause
    exit /b 1
)

echo.
echo [2/5] Verificando projeto...
npx eas project:info
if %errorlevel% neq 0 (
    echo ERRO: Projeto nao configurado corretamente!
    pause
    exit /b 1
)

echo.
echo [3/5] Limpando cache...
npx expo start --clear
timeout /t 3 /nobreak > nul
taskkill /f /im node.exe > nul 2>&1

echo.
echo [4/5] Iniciando build APK...
echo Este processo pode demorar 15-30 minutos...
echo Voce recebera o APK por email ou podera baixar do painel Expo
echo.

npx eas build --platform android --profile apk --non-interactive

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo BUILD CONCLUIDO COM SUCESSO!
    echo ========================================
    echo.
    echo O APK sera gerado e estara disponivel em:
    echo 1. Painel do Expo: https://expo.dev/accounts/shopiii2025/projects/beep-velozz/builds
    echo 2. Link enviado por email
    echo 3. Comando: npx eas build:list
    echo.
    echo Para instalar o APK:
    echo adb install nome-do-arquivo.apk
    echo.
) else (
    echo.
    echo ========================================
    echo ERRO NO BUILD!
    echo ========================================
    echo.
    echo Verifique os erros acima e tente novamente:
    echo 1. Verifique se todas as dependencias estao instaladas
    echo 2. Verifique se os assets estao corretos
    echo 3. Verifique se as configuracoes estao ok
    echo.
)

pause
