import assert from 'node:assert/strict';
import test from 'node:test';

import { createProjectSandboxManager } from '../src/project-sandbox-manager.mjs';

test('project sandbox manager creates a constrained project sandbox and issue worktree plan', async () => {
  const createdDirectories = [];
  const gitCalls = [];
  const manager = createProjectSandboxManager({
    async mkdir(path, options) {
      createdDirectories.push({ path, options });
    },
    async runGit(args) {
      gitCalls.push(args);
      return { stdout: '', stderr: '' };
    },
  });

  const sandbox = await manager.ensureProjectSandbox({
    sandboxRoot: 'C:/Users/BillMartin/.lambchop/sandboxes',
    projectSlug: 'lambchop',
  });

  assert.equal(
    sandbox.projectSandboxPath,
    'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop',
  );
  assert.deepEqual(createdDirectories, [
    {
      path: 'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop',
      options: { recursive: true },
    },
  ]);

  const worktree = await manager.createIssueWorktree({
    sandboxRoot: 'C:/Users/BillMartin/.lambchop/sandboxes',
    projectSlug: 'lambchop',
    issueNumber: 49,
    sourceCheckout: 'C:/Users/BillMartin/dev/Lambchop',
    baseBranch: 'main',
  });

  assert.equal(worktree.branch, 'codex/lambchop-issue-49');
  assert.equal(
    worktree.worktreePath,
    'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop\\worktrees\\issue-49',
  );
  assert.deepEqual(gitCalls, [
    [
      '-C',
      'C:\\Users\\BillMartin\\dev\\Lambchop',
      'worktree',
      'add',
      '-B',
      'codex/lambchop-issue-49',
      'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop\\worktrees\\issue-49',
      'main',
    ],
  ]);
});

test('project sandbox manager rejects unsafe roots, slugs, and issue numbers before shelling out', async () => {
  const gitCalls = [];
  const manager = createProjectSandboxManager({
    async mkdir() {},
    async runGit(args) {
      gitCalls.push(args);
    },
  });

  assert.throws(
    () => manager.projectSandboxStatus({
      sandboxRoot: '',
      projectSlug: 'lambchop',
    }),
    /sandboxRoot is required/,
  );
  assert.throws(
    () => manager.projectSandboxStatus({
      sandboxRoot: 'C:/Users/BillMartin/.lambchop/sandboxes',
      projectSlug: '../Lambchop',
    }),
    /Unsafe project slug/,
  );
  await assert.rejects(
    () => manager.createIssueWorktree({
      sandboxRoot: 'C:/Users/BillMartin/.lambchop/sandboxes',
      projectSlug: 'lambchop',
      issueNumber: '../49',
      sourceCheckout: 'C:/Users/BillMartin/dev/Lambchop',
    }),
    /issueNumber must be a positive integer/,
  );

  assert.deepEqual(gitCalls, []);
});
