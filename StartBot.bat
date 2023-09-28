sc config MySQL80 start= demand
net start MySQL80
cd %~dp0
node src\bot.js
TIMEOUT 100