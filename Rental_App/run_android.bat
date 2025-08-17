@echo off
setlocal

echo.
echo === STEP 1: Creating react-native.config.js ===
echo module.exports = {> react-native.config.js
echo.  project: {>> react-native.config.js
echo.    android: {>> react-native.config.js
echo.      sourceDir: './apps/android/android',>> react-native.config.js
echo.    },>> react-native.config.js
echo.  },>> react-native.config.js
echo.  reactNativePath: './apps/android/node_modules/react-native',>> react-native.config.js
echo };>> react-native.config.js
echo [✓] react-native.config.js created

echo.
echo === STEP 2: Creating settings.gradle ===
set SETTINGS_PATH=apps\android\android\settings.gradle

if not exist apps\android\android (
    echo [!] ERROR: Folder apps\android\android does not exist.
    echo     Run "npx react-native init android --directory apps/android/android --skip-install"
    goto end
)

> "%SETTINGS_PATH%" (
    echo rootProject.name = 'android'
    echo includeBuild('../../../node_modules/@react-native/gradle-plugin')
    echo include ':app'
)

echo [✓] settings.gradle written to %SETTINGS_PATH%

:end
endlocal
