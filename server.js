const { spawn } = require('child_process');
const path = require('path');

const child = spawn('bun', ['run', 'dev'], {
  cwd: __dirname,
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

const logStream = require('fs').createWriteStream(path.join(__dirname, 'dev.log'), { flags: 'w' });
child.stdout.pipe(logStream);
child.stderr.pipe(logStream);

child.unref();
console.log(`Server started with PID ${child.pid}`);
