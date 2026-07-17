#!/usr/bin/env node
/*
 * WebCheckr - Chrome Web Store packaging script.
 *
 *   npm run package:store
 *
 * Builds dist/webcheckr-v<version>/ containing ONLY the files the installed
 * extension needs, then zips it to releases/webcheckr-v<version>.zip with
 * manifest.json at the ZIP root (never nested in a wrapper folder).
 *
 * Design notes:
 *  - Zero dependencies. The ZIP is written directly with node:zlib, because
 *    adding an archiver package would break this project's no-dependency
 *    property for a one-off build step.
 *  - Cross-platform: pure Node, no shell/zip/PowerShell calls.
 *  - Deterministic: files are emitted in sorted order with a fixed timestamp,
 *    so identical sources produce a byte-identical ZIP.
 *  - Fails loudly. Any missing file, version mismatch, or forbidden entry
 *    aborts with a non-zero exit code rather than shipping a bad package.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ *
 * The allowlist: everything the installed extension needs at runtime.
 * Anything not named here is not shipped. Keep in sync with popup.html.
 * ------------------------------------------------------------------ */
const RUNTIME_FILES = [
  'manifest.json',

  // Popup UI
  'popup.html',
  'popup.css',
  'popup.js',

  // Injected into the inspected tab on demand
  'content.js',

  // Shared core (load order mirrors popup.html)
  'utils/dom.js',
  'utils/scoring.js',
  'utils/detect.js',
  'utils/runner.js',
  'utils/highlight.js',
  'utils/report.js',

  // Check modules
  'checks/basic.js',
  'checks/seo.js',
  'checks/social.js',
  'checks/links.js',
  'checks/buttons.js',
  'checks/downloads.js',
  'checks/accessibility.js',
  'checks/content-quality.js',
  'checks/performance.js',

  // Presets
  'presets/generic.js',
  'presets/platforms.js',
  'presets/webtoolkit.js',

  // Icons actually declared in the manifest. icons/source/ holds design
  // masters and is deliberately NOT shipped.
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

/* Patterns that must never appear inside the package. */
const FORBIDDEN = [
  /(^|[\\/])\.git([\\/]|$)/i,
  /(^|[\\/])\.github([\\/]|$)/i,
  /(^|[\\/])node_modules([\\/]|$)/i,
  /(^|[\\/])tests?([\\/]|$)/i,
  /(^|[\\/])docs([\\/]|$)/i,
  /(^|[\\/])scripts([\\/]|$)/i,
  /(^|[\\/])screenshots?([\\/]|$)/i,
  /(^|[\\/])releases?([\\/]|$)/i,
  /(^|[\\/])dist([\\/]|$)/i,
  /(^|[\\/])icons[\\/]source([\\/]|$)/i,
  /(^|[\\/])coverage([\\/]|$)/i,
  /\.md$/i,
  /^LICENSE$/i,
  /package(-lock)?\.json$/i,
  /\.(zip|crx|pem|key|p12|pfx|log|bak|tmp|env)$/i,
  /^\./,                       // dotfiles: .gitignore, .editorconfig, ...
  /(^|[\\/])\./,               // dotfiles in subdirs
  /\.(test|spec)\.(js|mjs)$/i,
  /(^|[\\/])(Thumbs\.db|Desktop\.ini|\.DS_Store)$/i
];

const fail = (msg) => { console.error(`\n  ERROR  ${msg}\n`); process.exit(1); };
const ok = (msg) => console.log(`  ok    ${msg}`);
const info = (msg) => console.log(`        ${msg}`);

/* ------------------------------------------------------------------ *
 * 1. Version agreement
 * ------------------------------------------------------------------ */
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

console.log('\nWebCheckr - Chrome Web Store package\n');

if (manifest.version !== pkg.version) {
  fail(`version mismatch: manifest.json is ${manifest.version} but package.json is ${pkg.version}`);
}
if (!/^\d+\.\d+(\.\d+){0,2}$/.test(manifest.version)) {
  fail(`invalid version format: ${manifest.version}`);
}
const VERSION = manifest.version;
ok(`version ${VERSION} (manifest.json === package.json)`);

/* ------------------------------------------------------------------ *
 * 2. Manifest validation
 * ------------------------------------------------------------------ */
const EXPECTED_PERMISSIONS = ['activeTab', 'scripting'];

if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
if (!manifest.name) fail('manifest name is missing');
if (manifest.name.length > 75) fail(`name is ${manifest.name.length} chars (max 75)`);
if (!manifest.description) fail('description is missing');
if (manifest.description.length > 132) fail(`description is ${manifest.description.length} chars (max 132)`);
if (manifest.short_name && manifest.short_name.length > 12) {
  fail(`short_name is ${manifest.short_name.length} chars (max 12)`);
}

const perms = [...(manifest.permissions || [])].sort();
if (JSON.stringify(perms) !== JSON.stringify([...EXPECTED_PERMISSIONS].sort())) {
  fail(`permissions changed: expected ${JSON.stringify(EXPECTED_PERMISSIONS)}, found ${JSON.stringify(manifest.permissions)}`);
}
for (const key of ['host_permissions', 'optional_permissions', 'optional_host_permissions',
  'content_scripts', 'externally_connectable', 'web_accessible_resources']) {
  if (manifest[key]) fail(`manifest must not declare "${key}" (found: ${JSON.stringify(manifest[key])})`);
}
ok(`permissions are exactly ${JSON.stringify(perms)}; no host/optional permissions`);

// JSON with comments would have thrown on parse above; assert no stray "//" too.
const manifestRaw = fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8');
if (/^\s*(\/\/|\/\*)/m.test(manifestRaw)) fail('manifest.json contains comments');

// Every manifest-referenced asset must be in the allowlist and on disk.
const referenced = [manifest.action?.default_popup, ...Object.values(manifest.icons || {})].filter(Boolean);
for (const ref of referenced) {
  if (!RUNTIME_FILES.includes(ref)) fail(`manifest references "${ref}" which is not in RUNTIME_FILES`);
  if (!fs.existsSync(path.join(ROOT, ref))) fail(`manifest references missing file: ${ref}`);
}
for (const size of ['16', '32', '48', '128']) {
  if (!manifest.icons?.[size]) fail(`manifest is missing the ${size}px icon`);
}
ok('manifest icons 16/32/48/128 and popup resolve');

/* ------------------------------------------------------------------ *
 * 3. Runtime reference audit (popup.html + executeScript)
 * ------------------------------------------------------------------ */
const popupHtml = fs.readFileSync(path.join(ROOT, 'popup.html'), 'utf8');
const htmlRefs = [
  ...[...popupHtml.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]),
  ...[...popupHtml.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => m[1]),
  ...[...popupHtml.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1])
];
for (const ref of htmlRefs) {
  if (/^https?:\/\//i.test(ref)) fail(`popup.html loads a remote resource: ${ref} (remotely hosted code is not allowed)`);
  if (!RUNTIME_FILES.includes(ref)) fail(`popup.html references "${ref}" which is not in RUNTIME_FILES`);
}
ok(`popup.html references ${htmlRefs.length} local files, all packaged`);

const popupJs = fs.readFileSync(path.join(ROOT, 'popup.js'), 'utf8');
for (const m of popupJs.matchAll(/files:\s*\[([^\]]+)\]/g)) {
  for (const f of m[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))) {
    if (!RUNTIME_FILES.includes(f)) fail(`popup.js injects "${f}" which is not in RUNTIME_FILES`);
  }
}
ok('injected scripts are packaged');

/* ------------------------------------------------------------------ *
 * 4. Existence + exact case check
 * ------------------------------------------------------------------ */
for (const rel of RUNTIME_FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`required file missing: ${rel}`);
  // Case-sensitivity guard: Windows/macOS are case-insensitive, Chrome on
  // Linux is not. Compare against the real directory listing.
  const dir = path.dirname(abs);
  const base = path.basename(abs);
  if (!fs.readdirSync(dir).includes(base)) fail(`filename case mismatch for: ${rel}`);
}
ok(`all ${RUNTIME_FILES.length} runtime files exist with exact-case names`);

/* ------------------------------------------------------------------ *
 * 5. Content safety scan (only over what ships)
 * ------------------------------------------------------------------ */
const BAD_CONTENT = [
  { re: /[A-Za-z]:\\\\?(Users|Development)\b/i, what: 'absolute Windows path' },
  { re: /\/(?:home|Users)\/[a-z0-9._-]+\//i, what: 'absolute POSIX home path' },
  { re: /\btoolkit\.txerv\.com\b/i, what: 'internal domain' },
  { re: /\bToolkit\.tech\b/i, what: 'old domain' },
  { re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, what: 'email address' },
  { re: /\b(api[_-]?key|client[_-]?secret|access[_-]?token)\b\s*[:=]/i, what: 'possible credential' },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, what: 'private key' },
  { re: /\bghp_[A-Za-z0-9]{36}\b|\bAKIA[0-9A-Z]{16}\b/, what: 'API token' },
  { re: /https?:\/\/(localhost|127\.0\.0\.1)/i, what: 'localhost URL' }
];

const TEXT_EXT = new Set(['.js', '.html', '.css', '.json']);
for (const rel of RUNTIME_FILES) {
  if (!TEXT_EXT.has(path.extname(rel))) continue;
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const { re, what } of BAD_CONTENT) {
    const hit = src.match(re);
    if (hit) {
      // Allow the literal patterns the checks legitimately search FOR.
      const line = src.slice(Math.max(0, hit.index - 90), hit.index + 90);
      if (/localhost/i.test(hit[0]) && /links\.env|localhostRefs|resolvedHref|isProd/.test(line)) continue;
      fail(`${what} found in ${rel}: ${JSON.stringify(hit[0].slice(0, 40))}`);
    }
  }
  // Remotely hosted code is a hard Web Store rejection.
  if (/<script[^>]+src=["']https?:\/\//i.test(src)) fail(`${rel} loads remote script`);
}
ok('no local paths, internal domains, emails, credentials or remote code in packaged files');

/* ------------------------------------------------------------------ *
 * 6. Build dist/
 * ------------------------------------------------------------------ */
const DIST_ROOT = path.join(ROOT, 'dist');
const PKG_DIR = path.join(DIST_ROOT, `webcheckr-v${VERSION}`);
const REL_DIR = path.join(ROOT, 'releases');
const ZIP_PATH = path.join(REL_DIR, `webcheckr-v${VERSION}.zip`);

// Safety: only ever remove a path we constructed inside dist/.
if (fs.existsSync(PKG_DIR)) {
  if (!path.resolve(PKG_DIR).startsWith(path.resolve(DIST_ROOT) + path.sep)) {
    fail('refusing to remove a directory outside dist/');
  }
  fs.rmSync(PKG_DIR, { recursive: true, force: true });
  info(`removed previous ${path.relative(ROOT, PKG_DIR)}`);
}
fs.mkdirSync(PKG_DIR, { recursive: true });
fs.mkdirSync(REL_DIR, { recursive: true });

for (const rel of RUNTIME_FILES) {
  const dest = path.join(PKG_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(ROOT, rel), dest);
}
ok(`copied ${RUNTIME_FILES.length} files to ${path.relative(ROOT, PKG_DIR)}/`);

/* Walk what we actually produced and re-verify it. */
function walk(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}
const packaged = walk(PKG_DIR).sort();

for (const rel of packaged) {
  for (const re of FORBIDDEN) {
    if (re.test(rel)) fail(`forbidden file in package: ${rel} (matched ${re})`);
  }
}
const missing = RUNTIME_FILES.filter(f => !packaged.includes(f));
const extra = packaged.filter(f => !RUNTIME_FILES.includes(f));
if (missing.length) fail(`missing from package: ${missing.join(', ')}`);
if (extra.length) fail(`unexpected files in package: ${extra.join(', ')}`);
if (!packaged.includes('manifest.json')) fail('manifest.json is not at the package root');
ok(`package contains exactly the ${packaged.length} approved files, manifest.json at root`);

/* ------------------------------------------------------------------ *
 * 7. Write the ZIP (manifest.json at the root, no wrapper folder)
 * ------------------------------------------------------------------ */
// Fixed timestamp keeps the output byte-identical across runs.
const DOS_TIME = 0;      // 00:00:00
const DOS_DATE = 33;     // 1980-01-01

function zipFiles(files, srcDir) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const name of files) {
    const data = fs.readFileSync(path.join(srcDir, name));
    const crc = zlib.crc32(data);
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    // Use whichever is smaller: deflate (8) or store (0).
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const nameBuf = Buffer.from(name, 'utf8');

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);   // local file header signature
    local.writeUInt16LE(20, 4);           // version needed
    local.writeUInt16LE(0, 6);            // flags
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);           // extra length
    chunks.push(local, nameBuf, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);      // central directory signature
    cd.writeUInt16LE(20, 4);              // version made by
    cd.writeUInt16LE(20, 6);              // version needed
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(DOS_TIME, 12);
    cd.writeUInt16LE(DOS_DATE, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);              // extra
    cd.writeUInt16LE(0, 32);              // comment
    cd.writeUInt16LE(0, 34);              // disk number
    cd.writeUInt16LE(0, 36);              // internal attrs
    // External attrs: regular file, mode 0644. `>>> 0` because JS bitwise ops
    // are signed 32-bit and this shift would otherwise go negative.
    cd.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    cd.writeUInt32LE(offset, 42);         // local header offset
    central.push(cd, nameBuf);

    offset += local.length + nameBuf.length + body.length;
  }

  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);       // end of central directory
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);               // comment length

  return Buffer.concat([...chunks, cdBuf, end]);
}

// Entry names use forward slashes and no leading "./" or wrapper directory.
// manifest.json is emitted first by convention; the rest are sorted so the
// archive is byte-identical between runs.
const rest = packaged.map(p => p.split(path.sep).join('/')).filter(p => p !== 'manifest.json').sort();
const entries = ['manifest.json', ...rest];
for (const name of entries) {
  if (!/^[A-Za-z0-9._\/-]+$/.test(name)) fail(`unsafe characters in entry name: ${name}`);
  if (name.startsWith('/') || name.includes('..')) fail(`unsafe entry path: ${name}`);
  if (/\.zip$/i.test(name)) fail(`package must not contain a ZIP: ${name}`);
}

if (fs.existsSync(ZIP_PATH)) fs.rmSync(ZIP_PATH, { force: true });
const zipBuf = zipFiles(entries, PKG_DIR);
fs.writeFileSync(ZIP_PATH, zipBuf);

/* ------------------------------------------------------------------ *
 * 8. Verify the ZIP we just wrote
 * ------------------------------------------------------------------ */
const readBack = fs.readFileSync(ZIP_PATH);
if (readBack.readUInt32LE(0) !== 0x04034b50) fail('ZIP does not start with a local file header');
if (readBack.readUInt32LE(readBack.length - 22) !== 0x06054b50) fail('ZIP end-of-central-directory not found');

// Re-read the archive through its central directory, the same way an unzipper
// would, rather than trusting what we think we wrote.
// EOCD is the last 22 bytes: total-entries at +10, CD size at +12, CD offset at +16.
const eocd = readBack.length - 22;
const eocdEntries = readBack.readUInt16LE(eocd + 10);
let cdOffset = readBack.readUInt32LE(eocd + 16);
const zipNames = [];
for (let i = 0; i < eocdEntries; i++) {
  if (readBack.readUInt32LE(cdOffset) !== 0x02014b50) fail('corrupt central directory');
  const nameLen = readBack.readUInt16LE(cdOffset + 28);
  const extraLen = readBack.readUInt16LE(cdOffset + 30);
  const commentLen = readBack.readUInt16LE(cdOffset + 32);
  zipNames.push(readBack.slice(cdOffset + 46, cdOffset + 46 + nameLen).toString('utf8'));
  cdOffset += 46 + nameLen + extraLen + commentLen;
}

if (eocdEntries !== entries.length) fail(`ZIP entry count ${eocdEntries} != ${entries.length}`);
if (!zipNames.includes('manifest.json')) fail('manifest.json is not a root entry in the ZIP');
for (const name of zipNames) {
  // A wrapper folder would make every entry share a top-level directory.
  if (/^webcheckr-v/i.test(name)) fail(`ZIP is wrapped in a folder: ${name}`);
  if (/\.zip$/i.test(name)) fail(`ZIP contains a ZIP: ${name}`);
  if (!RUNTIME_FILES.includes(name)) fail(`unexpected entry in ZIP: ${name}`);
}
const missingFromZip = RUNTIME_FILES.filter(f => !zipNames.includes(f));
if (missingFromZip.length) fail(`missing from ZIP: ${missingFromZip.join(', ')}`);
ok(`ZIP verified via central directory: ${zipNames.length} entries, manifest.json at root`);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

console.log('\n  Package ready\n');
console.log(`    ZIP path    ${path.relative(ROOT, ZIP_PATH).split(path.sep).join('/')}`);
console.log(`    ZIP size    ${kb(zipBuf.length)} (${zipBuf.length} bytes)`);
console.log(`    Files       ${entries.length}`);
console.log(`    Unpacked    ${kb(entries.reduce((s, f) => s + fs.statSync(path.join(PKG_DIR, f)).size, 0))}`);
console.log(`    Staged at   ${path.relative(ROOT, PKG_DIR).split(path.sep).join('/')}/`);
console.log('\n  ZIP root:');
const roots = [...new Set(entries.map(e => (e.includes('/') ? e.split('/')[0] + '/' : e)))].sort();
for (const r of roots) console.log(`    ${r}`);
console.log('\n  Upload this ZIP at https://chrome.google.com/webstore/devconsole\n');
