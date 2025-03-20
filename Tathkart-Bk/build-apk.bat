@echo off
echo Building APK for KiranaApp...

REM Check if Android SDK is available
if not defined ANDROID_HOME (
    echo ANDROID_HOME environment variable is not set.
    echo Please set it to your Android SDK location.
    exit /b 1
)

REM Navigate to the android directory
cd android

REM Clean the project
call gradlew clean

REM Build the release APK
call gradlew assembleRelease

REM Check if build was successful
if %ERRORLEVEL% neq 0 (
    echo Build failed with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo APK built successfully!
echo You can find the APK at:
echo android\app\build\outputs\apk\release\app-release.apk

REM Copy the APK to the project root for convenience
copy app\build\outputs\apk\release\app-release.apk ..\KiranaApp.apk

echo APK copied to project root as KiranaApp.apk 