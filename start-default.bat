@echo off
echo 🔧 Removendo metro.config.cjs para usar padrão do Expo...

if exist metro.config.cjs (
    move metro.config.cjs metro.config.cjs.backup
    echo ✅ metro.config.cjs movido para backup
) else (
    echo ℹ️  metro.config.cjs não encontrado
)

echo 🚀 Iniciando com configuração padrão do Expo...
npx expo start --clear

pause
