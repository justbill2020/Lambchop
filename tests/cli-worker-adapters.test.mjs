import assert from 'node:assert/strict';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCodexCliWorkerAdapter, createClaudeCliWorkerAdapter } from '../src/cli-worker-adapters.mjs';
import { createWorkerRuntime } from '../src/worker-adapter-contract.mjs';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

async function createSandboxWorkspace() {
  const sandboxRoot = await mkdtemp(join(tmpdir(), 'lambchop-adapter-'));
  const worktreePath = join(sandboxRoot, 'projects', 'lambchop', 'worktrees', 'issue-51');
  await mkdir(worktreePath, { recursive: true });
  return { sandboxRoot, worktreePath };
}

function requestFor(adapter, workspace) {
  return {
    adapter,
    taskBrief: {
      issueNumber: 51,
      title: 'Implement Codex CLI and Claude CLI MVP worker adapters',
      instructions: 'Return a deterministic adapter result.',
    },
    workspace: {
      sandboxRoot: workspace.sandboxRoot,
      worktreePath: workspace.worktreePath,
    },
    policy: {
      allowGithubMutations: false,
      allowedSideEffects: ['write-worktree-files', 'run-validation'],
    },
    validation: {
      expectedCommands: ['node --test tests/cli-worker-adapters.test.mjs'],
    },
  };
}

test('Codex and Claude CLI worker adapters are interchangeable at the worker contract', async () => {
  const events = [];
  const workspace = await createSandboxWorkspace();
  const fixtureCli = join(repoRoot, 'tests', 'fixtures', 'fake-ai-cli.mjs');
  const runtime = createWorkerRuntime({
    adapters: [
      createCodexCliWorkerAdapter({
        command: process.execPath,
        launcherArgs: [fixtureCli, 'codex'],
      }),
      createClaudeCliWorkerAdapter({
        command: process.execPath,
        launcherArgs: [fixtureCli, 'claude'],
      }),
    ],
    emitRunEvent(event) {
      events.push(event);
    },
  });

  const codexResult = await runtime.runWorker(requestFor('codex-cli', workspace));
  const claudeResult = await runtime.runWorker(requestFor('claude-cli', workspace));

  for (const result of [codexResult, claudeResult]) {
    assert.equal(result.status, 'succeeded');
    assert.equal(result.task.issueNumber, 51);
    assert.equal(result.policy.githubMutationsAllowed, false);
    assert.deepEqual(result.changedFiles, ['ADAPTER_RESULT.md']);
    assert.deepEqual(result.validation, {
      status: 'not_run',
      commands: ['node --test tests/cli-worker-adapters.test.mjs'],
    });
    assert.deepEqual(result.blockers, []);
    assert.match(result.transcriptSummary, /Implement Codex CLI and Claude CLI MVP worker adapters/);
  }

  assert.equal(codexResult.adapter, 'codex-cli');
  assert.match(codexResult.transcriptSummary, /FAKE_AI_ADAPTER:codex/);
  assert.equal(claudeResult.adapter, 'claude-cli');
  assert.match(claudeResult.transcriptSummary, /FAKE_AI_ADAPTER:claude/);
  assert.deepEqual(
    events.filter((event) => event.type === 'worker.run.output').map((event) => event.adapter),
    ['codex-cli', 'claude-cli'],
  );
});

test('CLI worker adapter reports a blocker when the underlying CLI exits non-zero', async () => {
  const workspace = await createSandboxWorkspace();
  const fixtureCli = join(repoRoot, 'tests', 'fixtures', 'fake-ai-cli.mjs');
  const runtime = createWorkerRuntime({
    adapters: [
      createCodexCliWorkerAdapter({
        command: process.execPath,
        launcherArgs: [fixtureCli, 'codex', '--fail'],
      }),
    ],
  });

  const result = await runtime.runWorker(requestFor('codex-cli', workspace));

  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.changedFiles, []);
  assert.equal(result.validation.status, 'not_run');
  assert.match(result.blockers[0].message, /CLI exited with code 17/);
});
