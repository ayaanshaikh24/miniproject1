import net from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3001;
const SERVER_ENTRY = path.resolve(__dirname, '..', 'index.js');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isPortInUse(port) {
  return await new Promise((resolve) => {
    const tester = net.createServer();
    tester
      .once('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.close(() => resolve(false));
      })
      .listen(port, '0.0.0.0');
  });
}

function parseWindowsNetstatOutput(output) {
  const lines = String(output || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const pids = new Set();

  for (const line of lines) {
    const cols = line.split(/\s+/);
    if (cols.length < 5) continue;
    const state = cols[3]?.toUpperCase();
    const pid = Number(cols[4]);
    if (state === 'LISTENING' && Number.isFinite(pid) && pid > 0) {
      pids.add(pid);
    }
  }

  return [...pids];
}

async function findPidsListeningOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const cmd = `netstat -ano -p tcp | findstr :${port}`;
      const { stdout } = await execAsync(cmd);
      return parseWindowsNetstatOutput(stdout);
    }

    const { stdout } = await execAsync(`lsof -ti tcp:${port}`);
    return String(stdout || '')
      .split(/\r?\n/)
      .map((s) => Number(s.trim()))
      .filter((pid) => Number.isFinite(pid) && pid > 0);
  } catch {
    return [];
  }
}

async function freePortWindows(port) {
  const psCommand = [
    `$pids = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
    'if ($pids) {',
    '  foreach ($pidValue in $pids) {',
    '    if ($pidValue -and $pidValue -ne $PID) {',
    '      Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue',
    '    }',
    '  }',
    '}',
    'exit 0',
  ].join('; ');

  const encoded = Buffer.from(psCommand, 'utf16le').toString('base64');
  await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`);
}

async function killPid(pid) {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return;
  }

  await delay(800);

  try {
    process.kill(pid, 0);
    process.kill(pid, 'SIGKILL');
  } catch {
    // process already stopped
  }
}

async function freePortIfNeeded(port) {
  if (process.platform === 'win32') {
    try {
      console.warn(`[startup] Ensuring port ${port} is free (Windows pre-start cleanup)...`);
      await freePortWindows(port);
      await delay(500);
      const stillInUseAfterPs = await isPortInUse(port);
      if (!stillInUseAfterPs) {
        console.log(`[startup] Port ${port} is now free.`);
        return;
      }
      console.warn('[startup] Port still busy after PowerShell cleanup, trying fallback PID detection...');
    } catch (err) {
      // Non-fatal: fallback PID detection below will still attempt cleanup.
    }
  }

  const inUse = await isPortInUse(port);
  if (!inUse) return;

  console.warn(`[startup] Port ${port} is busy. Attempting automatic cleanup...`);

  const pids = await findPidsListeningOnPort(port);
  const targetPids = pids.filter((pid) => pid !== process.pid);

  if (targetPids.length === 0) {
    throw new Error(`Port ${port} is in use but no listening process could be identified.`);
  }

  for (const pid of targetPids) {
    console.warn(`[startup] Stopping process ${pid} on port ${port}...`);
    await killPid(pid);
  }

  await delay(400);

  const stillInUse = await isPortInUse(port);
  if (stillInUse) {
    throw new Error(`Port ${port} is still in use after cleanup.`);
  }

  console.log(`[startup] Port ${port} is now free.`);
}

function startServerProcess() {
  const child = spawn(process.execPath, [SERVER_ENTRY], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`[startup] Server exited due to signal: ${signal}`);
      process.exit(1);
      return;
    }
    process.exit(code ?? 1);
  });

  process.on('SIGINT', () => {
    child.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
  });
}

async function run() {
  await freePortIfNeeded(PORT);
  startServerProcess();
}

run().catch((err) => {
  console.error(`[startup] Failed to launch server: ${err.message}`);
  process.exit(1);
});
