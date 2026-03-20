@echo off
echo 🧹 Limpando cache do Metro e node_modules...

rem Limpar cache do Metro
npx expo start --clear --non-interactive --web 2>nul || echo "Metro cache limpo"

rem Limpar cache do npm
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

rem Limpar cache do Expo
if exist .expo rmdir /s /q .expo
if exist .expo-shared rmdir /s /q .expo-shared

rem Limpar cache do Metro
if exist metro-cache rmdir /s /q metro-cache

echo ✅ Cache limpo com sucesso!
echo 📦 Instalando dependências...

npm install

echo 🚀 Pronto para iniciar! Use: npm run start:basic
pause
