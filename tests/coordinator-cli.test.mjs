import assert from 'node:assert/strict';
import test from 'node:test';

import { createCoordinatorCli } from '../src/coordinator-cli.mjs';

const readyForAgent = [{ name: 'ready-for-agent' }];

test('coordinator CLI status dry-run loads product framing, plans MVP work, and reads feedback without mutation', async () => {
  const clientCalls = [];
  const writes = [];
  const cli = createCoordinatorCli({
    issueClient: {
      async listIssues({ repository, state }) {
        clientCalls.push({ fn: 'listIssues', repository, state });
        return [
          {
            number: 42,
            title: 'Dogfood Lambchop as the first managed AI engineering project',
            state: 'OPEN',
            labels: readyForAgent,
            body: '## What to build\nParent goal.',
            url: 'https://github.com/justbill2020/Lambchop/issues/42',
          },
          {
            number: 43,
            title: 'Bootstrap Lambchop-operated MVP planning loop',
            state: 'OPEN',
            labels: readyForAgent,
            body: '## Parent\n\n#42\n\n## Blocked by\n\nNone - can start immediately',
            url: 'https://github.com/justbill2020/Lambchop/issues/43',
          },
        ];
      },
      async listComments({ repository, issueNumber }) {
        clientCalls.push({ fn: 'listComments', repository, issueNumber });
        return [
          {
            id: 'feedback-1',
            url: 'https://github.com/justbill2020/Lambchop/issues/42#issuecomment-feedback-1',
            author: { login: 'justbill2020' },
            body: [
              '/lambchop-feedback',
              'intent: retry',
              'target: #43',
              'message: Regenerate the MVP planning status.',
            ].join('\n'),
            createdAt: '2026-06-23T22:00:00Z',
          },
        ];
      },
      async createComment() {
        throw new Error('dry-run status must not mutate GitHub');
      },
    },
    async readText(path) {
      if (path === 'docs/lambchop/managed-projects.json') {
        return JSON.stringify({
          projects: [
            {
              slug: 'lambchop',
              name: 'Lambchop',
              github_repository: 'justbill2020/Lambchop',
              local_checkout: 'C:/Users/BillMartin/dev/Lambchop',
              default_branch: 'main',
              labels: {
                ready_for_agent: 'ready-for-agent',
                ready_for_human: 'ready-for-human',
              },
              policy: {
                source_of_truth: 'github-issues-and-prs',
                auto_merge: false,
                worker_sandbox_required: true,
              },
              dashboard: {
                title: 'Lambchop',
                role: 'first-managed-project',
              },
            },
          ],
        });
      }
      if (path === 'docs/lambchop/runner-peers.json') {
        return JSON.stringify({
          peers: [
            {
              runner_id: 'bill-windows',
              machine_label: 'Windows workstation',
              platform: 'windows',
              capabilities: ['node', 'gh', 'codex-cli'],
              workspace_roots: [
                {
                  label: 'lambchop-sandbox-root',
                  path: 'C:/Users/BillMartin/.lambchop/sandboxes',
                },
              ],
              availability: {
                status: 'available',
                repositories: ['justbill2020/Lambchop'],
                load: 0,
              },
              active_assignments: [],
              last_seen_at: '2999-06-23T23:29:30.000Z',
            },
          ],
        });
      }
      assert.equal(path, 'docs/lambchop/product-north-star.md');
      return '# Lambchop product north star\n\nLambchop is a model-agnostic AI engineering operations dashboard and orchestrator for all coding projects, with sandboxed execution and session analytics to reduce slop and churn.';
    },
    writeStdout(text) {
      writes.push(text);
    },
  });

  const result = await cli.run([
    'status',
    '--dry-run',
    '--repo',
    'justbill2020/Lambchop',
    '--goal',
    '42',
    '--north-star',
    'docs/lambchop/product-north-star.md',
    '--projects',
    'docs/lambchop/managed-projects.json',
    '--peers',
    'docs/lambchop/runner-peers.json',
    '--coordinator',
    'coordinator-windows',
  ]);

  assert.equal(result.exitCode, 0);
  assert.deepEqual(clientCalls, [
    { fn: 'listIssues', repository: 'justbill2020/Lambchop', state: 'all' },
    { fn: 'listComments', repository: 'justbill2020/Lambchop', issueNumber: 42 },
  ]);
  assert.equal(writes.length, 1);
  const status = JSON.parse(writes[0]);
  assert.equal(status.command, 'status');
  assert.equal(status.dry_run, true);
  assert.deepEqual(status.managed_projects, [
    {
      slug: 'lambchop',
      name: 'Lambchop',
      repository: 'justbill2020/Lambchop',
      default_branch: 'main',
      dashboard: {
        title: 'Lambchop',
        role: 'first-managed-project',
      },
      policy: {
        source_of_truth: 'github-issues-and-prs',
        auto_merge: false,
        worker_sandbox_required: true,
      },
    },
  ]);
  assert.equal(status.product_north_star, 'Lambchop is a model-agnostic AI engineering operations dashboard and orchestrator for all coding projects, with sandboxed execution and session analytics to reduce slop and churn.');
  assert.equal(status.mvp.active_goal.number, 42);
  assert.equal(status.mvp.next_issue.number, 43);
  assert.equal(status.feedback.unapplied_feedback, 1);
  assert.equal(status.feedback.next_feedback_action, 'Apply retry feedback to #43.');
  assert.deepEqual(status.peers, [
    {
      runner_id: 'bill-windows',
      machine_label: 'Windows workstation',
      platform: 'windows',
      health: 'active',
      availability: {
        status: 'available',
        repositories: ['justbill2020/Lambchop'],
        load: 0,
      },
      capabilities: ['node', 'gh', 'codex-cli'],
      workspace_roots: [{ label: 'lambchop-sandbox-root' }],
    },
  ]);
  assert.deepEqual(status.assignment, {
    assignment_state: 'assigned',
    assigned_issue: 43,
    assigned_runner: 'bill-windows',
    branch: 'codex/lambchop-issue-43',
    expires_at: status.assignment.expires_at,
  });
  assert.match(status.assignment.expires_at, /^\d{4}-\d{2}-\d{2}T/);
});

test('coordinator CLI returns usage errors for unsupported commands without touching GitHub', async () => {
  const cli = createCoordinatorCli({
    issueClient: {
      async listIssues() {
        throw new Error('unsupported commands must not read GitHub');
      },
    },
    writeStderr() {},
  });

  const result = await cli.run(['unknown-command']);

  assert.equal(result.exitCode, 2);
  assert.match(result.error.message, /Unsupported coordinator command/);
});

test('coordinator CLI exposes sandbox status and worktree preparation through the sandbox manager', async () => {
  const writes = [];
  const managerCalls = [];
  const sandboxManager = {
    projectSandboxStatus(options) {
      managerCalls.push({ fn: 'projectSandboxStatus', options });
      return {
        projectSlug: options.projectSlug,
        sandboxRoot: 'C:\\Users\\BillMartin\\.lambchop\\sandboxes',
        projectSandboxPath: 'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop',
        worktreesPath: 'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop\\worktrees',
      };
    },
    async createIssueWorktree(options) {
      managerCalls.push({ fn: 'createIssueWorktree', options });
      return {
        projectSlug: options.projectSlug,
        issueNumber: options.issueNumber,
        branch: 'codex/lambchop-issue-49',
        projectSandboxPath: 'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop',
        worktreePath: 'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop\\worktrees\\issue-49',
      };
    },
  };
  const cli = createCoordinatorCli({
    sandboxManager,
    writeStdout(text) {
      writes.push(JSON.parse(text));
    },
  });

  const statusResult = await cli.run([
    'sandbox-status',
    '--sandbox-root',
    'C:/Users/BillMartin/.lambchop/sandboxes',
    '--project',
    'lambchop',
  ]);
  const prepareResult = await cli.run([
    'prepare-worktree',
    '--sandbox-root',
    'C:/Users/BillMartin/.lambchop/sandboxes',
    '--project',
    'lambchop',
    '--issue',
    '49',
    '--source-checkout',
    'C:/Users/BillMartin/dev/Lambchop',
    '--base-branch',
    'main',
  ]);

  assert.equal(statusResult.exitCode, 0);
  assert.equal(prepareResult.exitCode, 0);
  assert.deepEqual(managerCalls, [
    {
      fn: 'projectSandboxStatus',
      options: {
        sandboxRoot: 'C:/Users/BillMartin/.lambchop/sandboxes',
        projectSlug: 'lambchop',
      },
    },
    {
      fn: 'createIssueWorktree',
      options: {
        sandboxRoot: 'C:/Users/BillMartin/.lambchop/sandboxes',
        projectSlug: 'lambchop',
        issueNumber: 49,
        sourceCheckout: 'C:/Users/BillMartin/dev/Lambchop',
        baseBranch: 'main',
      },
    },
  ]);
  assert.equal(writes[0].command, 'sandbox-status');
  assert.equal(writes[0].sandbox.project_slug, 'lambchop');
  assert.equal(writes[1].command, 'prepare-worktree');
  assert.deepEqual(writes[1].worktree, {
    project_slug: 'lambchop',
    issue_number: 49,
    branch: 'codex/lambchop-issue-49',
    project_sandbox_path: 'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop',
    worktree_path: 'C:\\Users\\BillMartin\\.lambchop\\sandboxes\\projects\\lambchop\\worktrees\\issue-49',
  });
});

test('coordinator CLI dogfood-proof dry-run checks authorization without publishing', async () => {
  const writes = [];
  const dogfoodCalls = [];
  const cli = createCoordinatorCli({
    dogfoodProofLoop: {
      async dryCheck(input) {
        dogfoodCalls.push({ fn: 'dryCheck', input });
        return {
          status: 'blocked',
          authorization: { status: 'not-authorized', may_open_pr: false, auto_merge: false },
          blockers: [{ type: 'pr-policy-disabled', message: 'PR policy disabled' }],
        };
      },
      async run() {
        throw new Error('dry-run must not publish');
      },
    },
    writeStdout(text) {
      writes.push(JSON.parse(text));
    },
  });

  const result = await cli.run([
    'dogfood-proof',
    '--dry-run',
    '--repo',
    'justbill2020/Lambchop',
    '--issue',
    '55',
    '--runner',
    'bill-windows',
    '--branch',
    'codex/lambchop-issue-55',
    '--adapter',
    'codex-cli',
  ]);

  assert.equal(result.exitCode, 0);
  assert.equal(dogfoodCalls.length, 1);
  assert.equal(dogfoodCalls[0].fn, 'dryCheck');
  assert.equal(dogfoodCalls[0].input.issueNumber, 55);
  assert.equal(dogfoodCalls[0].input.policy.may_open_pr, false);
  assert.equal(writes[0].command, 'dogfood-proof');
  assert.equal(writes[0].dry_run, true);
  assert.equal(writes[0].result.status, 'blocked');
  assert.equal(writes[0].evidence.run_container.issue_number, 55);
  assert.equal(writes[0].evidence.run_container.blockers[0].type, 'pr-policy-disabled');
  assert.equal(writes[0].evidence.analytics.blocker_count, 1);
});

test('coordinator CLI dogfood-proof run delegates to the dogfood loop when not dry-run', async () => {
  const writes = [];
  const dogfoodCalls = [];
  const cli = createCoordinatorCli({
    dogfoodProofLoop: {
      async dryCheck() {
        throw new Error('non-dry-run should call run');
      },
      async run(input) {
        dogfoodCalls.push({ fn: 'run', input });
        return {
          status: 'pr-opened',
          pullRequest: { url: 'https://github.com/justbill2020/Lambchop/pull/101' },
          autoMerge: false,
        };
      },
    },
    writeStdout(text) {
      writes.push(JSON.parse(text));
    },
  });

  const result = await cli.run([
    'dogfood-proof',
    '--repo',
    'justbill2020/Lambchop',
    '--issue',
    '55',
    '--runner',
    'bill-windows',
    '--branch',
    'codex/lambchop-issue-55',
    '--adapter',
    'codex-cli',
  ]);

  assert.equal(result.exitCode, 0);
  assert.equal(dogfoodCalls.length, 1);
  assert.equal(dogfoodCalls[0].fn, 'run');
  assert.equal(dogfoodCalls[0].input.issueNumber, 55);
  assert.equal(dogfoodCalls[0].input.policy.may_open_pr, false);
  assert.equal(writes[0].dry_run, false);
  assert.equal(writes[0].result.status, 'pr-opened');
  assert.equal(writes[0].result.autoMerge, false);
});

test('coordinator CLI pr-status delegates to the PR ownership loop', async () => {
  const writes = [];
  const ownershipCalls = [];
  const cli = createCoordinatorCli({
    prOwnershipLoop: {
      async observePullRequest(input) {
        ownershipCalls.push(input);
        return {
          status: 'merge-ready',
          auto_merge: false,
          pullRequest: {
            number: 92,
            url: 'https://github.com/justbill2020/Lambchop/pull/92',
          },
        };
      },
    },
    writeStdout(text) {
      writes.push(JSON.parse(text));
    },
  });

  const result = await cli.run([
    'pr-status',
    '--repo',
    'justbill2020/Lambchop',
    '--issue',
    '40',
    '--run',
    'run-40',
    '--pr',
    '92',
  ]);

  assert.equal(result.exitCode, 0);
  assert.deepEqual(ownershipCalls, [{
    repository: 'justbill2020/Lambchop',
    issueNumber: 40,
    runId: 'run-40',
    pullRequestNumber: 92,
  }]);
  assert.equal(writes[0].command, 'pr-status');
  assert.equal(writes[0].result.status, 'merge-ready');
  assert.equal(writes[0].result.auto_merge, false);
});
