@echo off
echo 🚀 Iniciando Beep Velozz no Windows...
echo.

REM Limpar variáveis que podem causar problemas
set NODE_OPTIONS=
set METRO_CONFIG_PATH=

REM Definir config explícito para Windows
set EXPO_METRO_CONFIG=metro.config.simple.cjs

echo 📦 Usando configuração Metro simplificada para Windows
echo.

REM Iniciar com configuração simples
npx expo start --config metro.config.simple.cjs

pause
