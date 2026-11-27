#!/usr/bin/env node
// Bumps the mobile app version (apps/mobile/package.json + app.json), then runs prebuild.
// Usage:
//   npm run bump                      -> x.x.<patch + 1>
//   npm run bump -- --v 2.1.0         -> sets 2.1.0 (also: -v, --version, -version, --v=2.1.0)
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = resolve(root, 'apps/mobile/package.json');
const appJsonPath = resolve(root, 'apps/mobile/app.json');

const VERSION_FLAGS = ['--v', '-v', '--version', '-version'];
const SEMVER = /^\d+\.\d+\.\d+$/;

function parseVersionArg(argv) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inline] = arg.split('=');
    if (!VERSION_FLAGS.includes(flag)) continue;
    const value = inline ?? argv[i + 1];
    if (!value) throw new Error(`${flag} requires a version string, e.g. ${flag} "2.1.0"`);
    return value;
  }
  return null;
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p, data) => writeFileSync(p, JSON.stringify(data, null, 2) + '\n');

try {
  const pkg = readJson(pkgPath);
  const appJson = readJson(appJsonPath);
  const current = pkg.version;

  if (!SEMVER.test(current)) throw new Error(`Current version "${current}" is not x.x.x`);
  if (appJson.expo.version !== current) {
    console.warn(`Warning: app.json version (${appJson.expo.version}) differs from package.json (${current}); syncing both.`);
  }

  let next = parseVersionArg(process.argv.slice(2));
  if (next) {
    if (!SEMVER.test(next)) throw new Error(`Invalid version "${next}", expected x.x.x`);
  } else {
    const [major, minor, patch] = current.split('.').map(Number);
    next = `${major}.${minor}.${patch + 1}`;
  }

  pkg.version = next;
  appJson.expo.version = next;
  writeJson(pkgPath, pkg);
  writeJson(appJsonPath, appJson);
  console.log(`Version: ${current} -> ${next}`);

  if (!process.env.SKIP_PREBUILD) {
    execSync('npm run prebuild', { cwd: root, stdio: 'inherit' });
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
