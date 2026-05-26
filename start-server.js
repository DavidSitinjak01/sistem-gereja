const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Kill any existing server
try { require('child_process').execSync('pkill -f "next dev" || true'); } catch(e) {}

const logFile = fs.openSync(path.join(__dirname, 'dev.log'), 'w');

const child = spawn('bun', ['run', 'dev'], {
  cwd: __dirname,
  detached: true,
  stdio: ['ignore', logFile, logFile],
  env: { ...process.env }
});

child.unref();

// Give it time to start then verify
setTimeout(() => {
  const http = require('http');
  http.get('http://localhost:3000', (res) => {
    console.log(`Server is running! PID: ${child.pid}, Status: ${res.statusCode}`);
    process.exit(0);
  }).on('error', () => {
    console.log(`Server started with PID ${child.pid} but not yet ready`);
    process.exit(0);
  });
}, 5000);
