import assert from 'node:assert/strict';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

test('Codex CLI adapter can launch and observe local agent work through the shared seam', async () => {
  const { createCliAgentRuntime } = await import('../src/cli-agent-runtime.mjs');

  const runtime = createCliAgentRuntime({
    codexCliPath: process.execPath,
  });

  const fixtureCli = join(repoRoot, 'tests', 'fixtures', 'fake-codex-cli.mjs');
  const run = runtime.startRun({
    adapter: 'codex-cli',
    storyKey: 'story-cli-adapter',
    prompt: 'Ship the first vertical slice.',
    extraArgs: [fixtureCli, '--json', '--sandbox', 'danger-full-access'],
  });

  assert.equal(run.adapter, 'codex-cli');
  assert.equal(run.status, 'running');
  assert.match(run.command.command, /node(.exe)?$/i);
  assert.deepEqual(run.command.args, [fixtureCli, '--json', '--sandbox', 'danger-full-access']);

  const completedRun = await run.completed;

  assert.equal(completedRun.status, 'succeeded');
  assert.equal(completedRun.exitCode, 0);
  assert.match(completedRun.stdout, /FAKE_CODEX_START/);
  assert.match(completedRun.stdout, /FAKE_CODEX_DONE/);
  assert.match(completedRun.stdout, /--json/);
  assert.match(completedRun.stdout, /danger-full-access/);
  assert.ok(Date.parse(completedRun.startedAt), 'startedAt should be an ISO timestamp');
  assert.ok(Date.parse(completedRun.finishedAt), 'finishedAt should be an ISO timestamp');
});
