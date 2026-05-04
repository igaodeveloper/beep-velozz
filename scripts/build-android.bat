@echo off
echo Building APK with fixes for black screen issue...

echo Step 1: Cleaning cache...
npx expo start --clear

echo Step 2: Installing dependencies...
npm install

echo Step 3: Building Android APK...
npx eas build --platform android --profile preview --local

echo Build completed!
pause
