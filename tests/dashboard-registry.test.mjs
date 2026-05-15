import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const serverModuleUrl = pathToFileURL(join(process.cwd(), 'autonomous-coding-team', 'assets', 'templates', 'dashboard-server', 'server.mjs')).href;

test('dashboard registry keeps stale projects visible instead of dropping them', async () => {
  const { registeredProjects } = await import(`${serverModuleUrl}?case=stale-${Date.now()}`);
  const registryRoot = mkdtempSync(join(tmpdir(), 'lambchop-registry-stale-'));
  writeFileSync(join(registryRoot, 'stale.json'), JSON.stringify({
    slug: 'stale',
    name: 'Stale Project',
    api_url: 'http://127.0.0.1:9999',
    status_endpoint: 'http://127.0.0.1:9999/api/status',
    events_endpoint: 'http://127.0.0.1:9999/api/events',
    last_seen_at: '2026-01-01T00:00:00.000Z',
  }));

  const projects = await registeredProjects({ registryRoot, now: Date.parse('2026-01-01T00:02:00.000Z'), liveProjectWindowMs: 20000 });

  assert.equal(projects.length, 1);
  assert.equal(projects[0].slug, 'stale');
  assert.equal(projects[0].health, 'stale');
  assert.ok(projects[0].last_seen_age_ms >= 120000);
});

test('dashboard registry ignores partial registration files without hiding valid entries', async () => {
  const { registeredProjects } = await import(`${serverModuleUrl}?case=partial-${Date.now()}`);
  const registryRoot = mkdtempSync(join(tmpdir(), 'lambchop-registry-partial-'));
  writeFileSync(join(registryRoot, 'partial.json'), '');
  writeFileSync(join(registryRoot, 'live.json'), JSON.stringify({
    slug: 'live',
    name: 'Live Project',
    api_url: 'http://127.0.0.1:8766',
    status_endpoint: 'http://127.0.0.1:8766/api/status',
    events_endpoint: 'http://127.0.0.1:8766/api/events',
    last_seen_at: '2026-01-01T00:00:19.000Z',
  }));

  const projects = await registeredProjects({ registryRoot, now: Date.parse('2026-01-01T00:00:20.000Z'), liveProjectWindowMs: 20000 });

  assert.deepEqual(projects.map((project) => project.slug), ['live']);
  assert.equal(projects[0].health, 'live');
});

test('dashboard registration writes atomically without leaving zero-byte project files', async () => {
  const { registerProject } = await import(`${serverModuleUrl}?case=atomic-${Date.now()}`);
  const registryRoot = mkdtempSync(join(tmpdir(), 'lambchop-registry-atomic-'));
  const statusRoot = mkdtempSync(join(tmpdir(), 'lambchop-status-atomic-'));
  writeFileSync(join(statusRoot, 'state.json'), JSON.stringify({
    project: { slug: 'atomic', name: 'Atomic Project', purpose: 'Test project' },
    work_items: [],
  }));

  await registerProject({
    registryRoot,
    root: statusRoot,
    projectSlug: 'atomic',
    projectName: 'Atomic Project',
    projectApiUrl: 'http://127.0.0.1:9876',
  });

  const body = readFileSync(join(registryRoot, 'atomic.json'), 'utf8');
  assert.ok(body.length > 0);
  assert.equal(JSON.parse(body).slug, 'atomic');
});

test('dashboard command endpoint queues known actions for automation execution only', async () => {
  const { queueDashboardCommand } = await import(`${serverModuleUrl}?case=command-${Date.now()}`);
  const statusRoot = mkdtempSync(join(tmpdir(), 'lambchop-command-queue-'));

  const command = await queueDashboardCommand({
    action: 'lambchop-update',
    requested_by: 'hub',
    reason: 'Project is behind the saved Lambchop source commit.',
  }, { root: statusRoot });

  assert.equal(command.status, 'queued');
  assert.equal(command.execution, 'automation');
  const queue = JSON.parse(readFileSync(join(statusRoot, 'dashboard-control-requests.json'), 'utf8'));
  assert.equal(queue.requests.length, 1);
  assert.equal(queue.requests[0].action, 'lambchop-update');

  await assert.rejects(
    () => queueDashboardCommand({ action: 'run-arbitrary-shell' }, { root: statusRoot }),
    /Unsupported dashboard command action/
  );
});
