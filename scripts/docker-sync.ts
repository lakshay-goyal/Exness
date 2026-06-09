import { spawnSync } from 'child_process';
import path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');
const COMPOSE = ['-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml'];

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('Syncing docker env from root .env...');
run('bun', ['run', 'sync:docker-env']);

console.log('\nApplying dev overlay (volume mounts + watch mode)...');
run('docker', ['compose', ...COMPOSE, 'up', '-d', '--remove-orphans']);

console.log('\nDocker dev stack synced.');
console.log('Source is bind-mounted — bun --watch reloads backend/engine/dbstorage/web on save.');
