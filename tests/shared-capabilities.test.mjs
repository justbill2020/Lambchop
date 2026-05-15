import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const scriptPath = join(repoRoot, 'autonomous-coding-team', 'tools', 'install-upstream-skills.ps1');
const manifestPath = join(repoRoot, 'autonomous-coding-team', 'references', 'core-upstream-skills.json');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    shell: false,
  });
  if (options.allowFailure) return result;
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function initSkillRepo(root, skillName, skillSubdir = '.') {
  const skillRoot = join(root, skillSubdir);
  mkdirSync(skillRoot, { recursive: true });
  writeFileSync(join(skillRoot, 'SKILL.md'), `---\nname: ${skillName}\ndescription: test skill\n---\n# ${skillName}\n`);
  run('git', ['init'], { cwd: root });
  run('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  run('git', ['config', 'user.name', 'Test User'], { cwd: root });
  run('git', ['add', '.'], { cwd: root });
  run('git', ['commit', '-m', `initial ${skillName}`], { cwd: root });
  return run('git', ['rev-parse', 'HEAD'], { cwd: root }).stdout.trim();
}

test('core upstream manifest defines Superpowers and Huashu as shared capabilities', () => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const names = manifest.skills.map((skill) => skill.name);
  assert.ok(names.includes('superpowers'), 'Superpowers capability missing');
  assert.ok(names.includes('huashu-design'), 'Huashu capability missing');
  const huashu = manifest.skills.find((skill) => skill.name === 'huashu-design');
  assert.equal(huashu.repository, 'https://github.com/alchaincyf/huashu-design.git');
  assert.match(huashu.use_when, /dashboard|UI|prototype|design/i);
});

test('upstream skill installer installs missing skills and records source commits', () => {
  const root = mkdtempSync(join(tmpdir(), 'lambchop-shared-capabilities-'));
  const skillsRoot = join(root, 'skills');
  const codexHome = join(root, 'codex-home');
  const huashuRepo = join(root, 'huashu-source');
  const huashuCommit = initSkillRepo(huashuRepo, 'huashu-design');
  const superpowersRepo = join(root, 'superpowers-source');
  const superpowersCommit = initSkillRepo(superpowersRepo, 'test-driven-development', join('skills', 'test-driven-development'));
  const overrides = join(root, 'overrides.json');
  writeFileSync(overrides, JSON.stringify({
    'huashu-design': huashuRepo,
    superpowers: superpowersRepo,
  }));

  const result = run('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scriptPath,
    '-Destination',
    skillsRoot,
    '-CodexHome',
    codexHome,
    '-SourceOverridesJson',
    overrides,
  ]);

  assert.match(result.stdout, /installed: huashu-design/i);
  assert.match(result.stdout, /installed: superpowers/i);
  assert.ok(existsSync(join(skillsRoot, 'huashu-design', 'SKILL.md')));
  assert.ok(existsSync(join(skillsRoot, 'test-driven-development', 'SKILL.md')));

  const registry = JSON.parse(readFileSync(join(codexHome, 'lambchop', 'shared-capabilities.json'), 'utf8'));
  assert.equal(registry.capabilities['huashu-design'].installed_commit, huashuCommit);
  assert.equal(registry.capabilities.superpowers.installed_commit, superpowersCommit);
  assert.equal(registry.capabilities['huashu-design'].status, 'installed');
});

test('upstream skill installer accepts an omitted source override file', () => {
  const root = mkdtempSync(join(tmpdir(), 'lambchop-shared-capabilities-no-overrides-'));
  const skillsRoot = join(root, 'skills');
  const codexHome = join(root, 'codex-home');
  const manifest = join(root, 'manifest.json');
  const huashuRepo = join(root, 'huashu-source');
  initSkillRepo(huashuRepo, 'huashu-design');
  writeFileSync(manifest, JSON.stringify({
    version: 1,
    registry_file: 'lambchop/shared-capabilities.json',
    skills: [{
      name: 'huashu-design',
      display_name: 'Huashu Design',
      repository: huashuRepo,
      install_type: 'single_skill',
      skill_path: '.',
      target_name: 'huashu-design',
      required: true,
      use_when: 'design work',
    }],
  }));

  const result = run('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scriptPath,
    '-Destination',
    skillsRoot,
    '-CodexHome',
    codexHome,
    '-ManifestPath',
    manifest,
  ]);

  assert.match(result.stdout, /installed: huashu-design/i);
  assert.ok(existsSync(join(skillsRoot, 'huashu-design', 'SKILL.md')));
});

test('upstream skill installer skips existing current installs and reports update availability from saved commits', () => {
  const root = mkdtempSync(join(tmpdir(), 'lambchop-shared-capabilities-update-'));
  const skillsRoot = join(root, 'skills');
  const codexHome = join(root, 'codex-home');
  const huashuRepo = join(root, 'huashu-source');
  const firstCommit = initSkillRepo(huashuRepo, 'huashu-design');
  const superpowersRepo = join(root, 'superpowers-source');
  initSkillRepo(superpowersRepo, 'test-driven-development', join('skills', 'test-driven-development'));
  const overrides = join(root, 'overrides.json');
  writeFileSync(overrides, JSON.stringify({
    'huashu-design': huashuRepo,
    superpowers: superpowersRepo,
  }));

  run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Destination', skillsRoot, '-CodexHome', codexHome, '-SourceOverridesJson', overrides]);
  writeFileSync(join(huashuRepo, 'README.md'), 'new upstream work\n');
  run('git', ['add', '.'], { cwd: huashuRepo });
  run('git', ['commit', '-m', 'update huashu'], { cwd: huashuRepo });
  const latestCommit = run('git', ['rev-parse', 'HEAD'], { cwd: huashuRepo }).stdout.trim();

  const check = run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Destination', skillsRoot, '-CodexHome', codexHome, '-SourceOverridesJson', overrides, '-CheckOnly']);

  assert.notEqual(firstCommit, latestCommit);
  assert.match(check.stdout, /update_available: huashu-design/i);
  const registry = JSON.parse(readFileSync(join(codexHome, 'lambchop', 'shared-capabilities.json'), 'utf8'));
  assert.equal(registry.capabilities['huashu-design'].installed_commit, firstCommit);
  assert.equal(registry.capabilities['huashu-design'].latest_commit, latestCommit);
  assert.equal(registry.capabilities['huashu-design'].status, 'update_available');
});
