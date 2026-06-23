import assert from 'node:assert/strict';
import test from 'node:test';

import { createWorkerRuntime, createFakeWorkerAdapter } from '../src/worker-adapter-contract.mjs';

test('fake worker runs through the worker contract inside a sandboxed worktree path', async () => {
  const events = [];
  const runtime = createWorkerRuntime({
    adapters: [createFakeWorkerAdapter()],
    emitRunEvent(event) {
      events.push(event);
    },
    now: (() => {
      const times = [
        '2026-06-23T23:00:00.000Z',
        '2026-06-23T23:00:01.000Z',
        '2026-06-23T23:00:02.000Z',
        '2026-06-23T23:00:03.000Z',
      ];
      return () => times.shift() ?? '2026-06-23T23:00:04.000Z';
    })(),
  });

  const result = await runtime.runWorker({
    adapter: 'fake-worker',
    taskBrief: {
      issueNumber: 50,
      title: 'Define worker adapter contract with fake worker',
      instructions: 'Emit deterministic evidence for the coordinator.',
    },
    workspace: {
      sandboxRoot: 'C:/Users/BillMartin/.lambchop/sandboxes',
      worktreePath: 'C:/Users/BillMartin/.lambchop/sandboxes/projects/lambchop/worktrees/issue-50',
    },
    policy: {
      allowGithubMutations: false,
      allowedSideEffects: ['write-worktree-files', 'run-validation'],
    },
    validation: {
      expectedCommands: ['node --test tests/worker-adapter-contract.test.mjs'],
    },
  });

  assert.equal(result.status, 'succeeded');
  assert.equal(result.adapter, 'fake-worker');
  assert.equal(result.task.issueNumber, 50);
  assert.equal(result.policy.githubMutationsAllowed, false);
  assert.deepEqual(result.changedFiles, ['FAKE_WORKER_RESULT.md']);
  assert.deepEqual(result.validation, {
    status: 'passed',
    commands: ['node --test tests/worker-adapter-contract.test.mjs'],
  });
  assert.deepEqual(result.blockers, []);
  assert.equal(result.workspace.worktreePath, 'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop\\worktrees\\issue-50');
  assert.deepEqual(events.map((event) => event.type), [
    'worker.run.started',
    'worker.run.output',
    'worker.run.validation',
    'worker.run.completed',
  ]);
  assert.ok(events.every((event) => event.run_id === result.runId));
});

test('worker runtime rejects unsafe worktree paths before invoking an adapter', async () => {
  let adapterInvoked = false;
  const runtime = createWorkerRuntime({
    adapters: [
      {
        name: 'unsafe-check',
        async run() {
          adapterInvoked = true;
          return {};
        },
      },
    ],
  });

  await assert.rejects(
    () => runtime.runWorker({
      adapter: 'unsafe-check',
      taskBrief: {
        issueNumber: 50,
        title: 'Unsafe path',
      },
      workspace: {
        sandboxRoot: 'C:/Users/BillMartin/.lambchop/sandboxes',
        worktreePath: 'C:/Users/BillMartin/dev/Lambchop',
      },
      policy: {
        allowGithubMutations: false,
      },
      validation: {},
    }),
    /outside the managed sandbox root/,
  );

  assert.equal(adapterInvoked, false);
});

test('worker runtime blocks direct GitHub mutation capability from worker adapters', async () => {
  const runtime = createWorkerRuntime({
    adapters: [createFakeWorkerAdapter()],
  });

  await assert.rejects(
    () => runtime.runWorker({
      adapter: 'fake-worker',
      taskBrief: {
        issueNumber: 50,
        title: 'Attempt direct tracker mutation',
      },
      workspace: {
        sandboxRoot: 'C:/Users/BillMartin/.lambchop/sandboxes',
        worktreePath: 'C:/Users/BillMartin/.lambchop/sandboxes/projects/lambchop/worktrees/issue-50',
      },
      policy: {
        allowGithubMutations: true,
      },
      validation: {},
    }),
    /Workers cannot directly mutate GitHub Issues or PRs/,
  );
});
