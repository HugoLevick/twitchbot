@echo off
setlocal enabledelayedexpansion
cd %~dp0

del "C:\Program Files\twitchbot\.env"
del ".env"

echo Settings have been reset
pause