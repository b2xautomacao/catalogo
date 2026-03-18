const fs = require('fs');
const path = require('path');
const logFile = 'C:\\Users\\Kleyton\\.gemini\\antigravity\\brain\\9c382792-53b7-4dd8-bfda-f54c37bfac27\\.system_generated\\steps\\256\\output.txt';
const content = fs.readFileSync(logFile, 'utf8');
const data = JSON.parse(content);
const logs = data.result.result;
const errors = logs.filter(l => l.status_code === 500);
console.log(JSON.stringify(errors, null, 2));
