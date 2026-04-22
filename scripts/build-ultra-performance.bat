@echo off
REM Build Ultra Performance Script
REM Script para build industrial com otimizações máximas

echo.
echo ========================================
echo   Beep Velozz - Ultra Performance Build
echo ========================================
echo.

REM Verificar ambiente
echo [1/8] Verificando ambiente...
node --version
npm --version

REM Limpar cache anterior
echo.
echo [2/8] Limpando cache...
if exist .metro-cache rmdir /s /q .metro-cache
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist dist rmdir /s /q dist
npx expo start --clear --non-interactive > nul 2>&1

REM Usar configuração ultra performance
echo.
echo [3/8] Aplicando configuração ultra performance...
copy metro.config.ultra-performance.cjs metro.config.cjs > nul

REM Instalar dependências otimizadas
echo.
echo [4/8] Instalando dependências otimizadas...
npm ci --prefer-offline --no-audit --no-fund

REM Otimizar dependências
echo.
echo [5/8] Otimizando dependências...
npx npm-check-updates --upgrade --target minor
npm install

REM Build de produção
echo.
echo [6/8] Build de produção ultra otimizado...
set NODE_ENV=production
set HERMES_ENABLED=true
set TURBO_MODE=true

REM Executar build com flags de otimização
npx expo export --platform all --output-dir dist --dev false --minify true --clear

REM Otimizar bundle
echo.
echo [7/8] Otimizando bundle...
if exist dist\assets\*.jsbundle (
    echo Otimizando JS Bundle...
    REM Adicionar otimizações de bundle aqui
)

REM Gerar relatório
echo.
echo [8/8] Gerando relatório de performance...
if exist dist (
    echo Build concluído com sucesso!
    echo.
    echo Tamanho do bundle:
    dir dist\assets\*.jsbundle | find "bytes"
    echo.
    echo Arquivos gerados:
    dir dist /s | find "arquivo(s)"
) else (
    echo ERRO: Build falhou!
    exit /b 1
)

echo.
echo ========================================
echo   Build Ultra Performance Concluído!
echo ========================================
echo.
echo Para usar o build otimizado:
echo   npx expo start --config metro.config.ultra-performance.cjs
echo.
echo Para build de produção:
echo   eas build --platform all --profile production
echo.

REM Restaurar config original se necessário
echo Deseja restaurar configuração original? (S/N)
set /p restore=
if /i "%restore%"=="S" (
    copy metro.config.default.cjs metro.config.cjs > nul
    echo Configuração original restaurada.
)

echo.
echo Script concluído!
