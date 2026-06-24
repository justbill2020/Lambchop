import assert from 'node:assert/strict';
import test from 'node:test';

import { createMvpDashboardProjection } from '../src/mvp-dashboard-projection.mjs';

test('MVP dashboard projection exposes managed project, planning, peers, runs, feedback, and analytics', () => {
  const projection = createMvpDashboardProjection().project({
    managedProjects: [
      {
        slug: 'lambchop',
        name: 'Lambchop',
        repository: 'justbill2020/Lambchop',
        dashboard: { role: 'first-managed-project' },
      },
    ],
    planning: {
      activeGoal: {
        number: 42,
        title: 'Dogfood Lambchop as the first managed AI engineering project',
        url: 'https://github.com/justbill2020/Lambchop/issues/42',
      },
      nextIssue: {
        number: 54,
        title: 'Build MVP single-pane dashboard with feedback controls and analytics v0',
        url: 'https://github.com/justbill2020/Lambchop/issues/54',
      },
      status: {
        counts: { child_issues: 13, ready: 1, blocked: 2, done: 10, human: 0 },
        blockers: [{ number: 55, title: 'Dogfood one complete Lambchop issue-to-PR loop', blocked_by: [54] }],
        parallelizable_candidates: [{ number: 54, title: 'Build MVP single-pane dashboard with feedback controls and analytics v0' }],
      },
    },
    peers: [
      {
        runnerId: 'bill-windows',
        machineLabel: 'Windows workstation',
        platform: 'windows',
        health: 'active',
        availability: { status: 'available', load: 0 },
        capabilities: ['node', 'gh', 'codex-cli'],
      },
    ],
    assignment: {
      assignment_state: 'assigned',
      assigned_issue: 54,
      assigned_runner: 'bill-windows',
      branch: 'codex/lambchop-issue-54',
      expires_at: '2026-06-24T02:00:00.000Z',
    },
    runContainers: [
      {
        runId: 'run-54',
        issueNumber: 54,
        issue: {
          number: 54,
          title: 'Build MVP single-pane dashboard with feedback controls and analytics v0',
          labels: ['ready-for-agent'],
          acceptance: ['dashboard shows run containers'],
          dependencies: [40],
          url: 'https://github.com/justbill2020/Lambchop/issues/54',
        },
        sandbox: {
          sandboxId: 'sandbox-lambchop-54',
          projectSandboxPath: 'C:/Users/BillMartin/.lambchop/sandboxes/projects/lambchop',
          worktreePath: 'C:/Users/BillMartin/.lambchop/sandboxes/projects/lambchop/worktrees/issue-54',
          mountedPaths: [{ label: 'workspace', path: '/sandbox/workspace' }],
          allowedNetwork: ['github.com'],
          allowedSecrets: ['GITHUB_TOKEN'],
        },
        worker: { adapter: 'codex-cli', model: 'gpt-5-codex' },
        branch: 'codex/lambchop-issue-54',
        pullRequest: { url: 'https://github.com/justbill2020/Lambchop/pull/88', state: 'OPEN' },
        prStatus: {
          state: 'merge-ready',
          merge_state: 'CLEAN',
          review_decision: 'APPROVED',
          auto_merge: false,
        },
        repair: {
          status: 'scheduled',
          run_id: 'run-54-repair-1',
          reason: 'ci-failed',
        },
        validation: { status: 'passed', failures: 0 },
        timeline: [
          { type: 'selected', at: '2026-06-23T23:00:00Z', summary: 'Selected #54.' },
          { type: 'pr.opened', at: '2026-06-23T23:10:00Z', summary: 'PR opened.' },
        ],
        issueComments: ['https://github.com/justbill2020/Lambchop/issues/54#issuecomment-1'],
        workLogPath: 'runs/run-54/work-log.md',
        blockers: [],
      },
    ],
    feedback: {
      allowedIntents: ['approve', 'reject', 'revise', 'pause', 'resume', 'retry', 'reassign', 'escalate'],
      queue: [{ intent: 'retry', target: '#54', status: 'pending' }],
    },
    analytics: {
      retryCount: 1,
      validationFailures: 0,
      churnedFiles: ['docs/lambchop/dashboard.html'],
      timeToPrMinutes: 18,
      blockerCount: 0,
      adapterUsed: 'codex-cli',
      humanInterventionPoints: ['feedback:retry'],
    },
    policyRequests: [
      {
        action: 'policy-authorization-request',
        status: 'needs-human-approval',
        issue_number: 55,
        requested_capability: 'open-linked-pr',
      },
    ],
  });

  assert.deepEqual(projection.project, {
    slug: 'lambchop',
    name: 'Lambchop',
    repository: 'justbill2020/Lambchop',
    role: 'first-managed-project',
  });
  assert.equal(projection.mvp.active_goal.number, 42);
  assert.equal(projection.mvp.next_issue.number, 54);
  assert.equal(projection.peers[0].runner_id, 'bill-windows');
  assert.equal(projection.assignment.assigned_runner, 'bill-windows');
  assert.equal(projection.run_containers[0].worker.adapter, 'codex-cli');
  assert.deepEqual(projection.run_containers[0].issue, {
    number: 54,
    title: 'Build MVP single-pane dashboard with feedback controls and analytics v0',
    labels: ['ready-for-agent'],
    acceptance: ['dashboard shows run containers'],
    dependencies: [40],
    url: 'https://github.com/justbill2020/Lambchop/issues/54',
  });
  assert.deepEqual(projection.run_containers[0].sandbox, {
    sandbox_id: 'sandbox-lambchop-54',
    project_sandbox_path: 'C:/Users/BillMartin/.lambchop/sandboxes/projects/lambchop',
    worktree_path: 'C:/Users/BillMartin/.lambchop/sandboxes/projects/lambchop/worktrees/issue-54',
    mounted_paths: [{ label: 'workspace', path: '/sandbox/workspace' }],
    allowed_network: ['github.com'],
    allowed_secrets: ['GITHUB_TOKEN'],
  });
  assert.equal(projection.run_containers[0].pull_request.url, 'https://github.com/justbill2020/Lambchop/pull/88');
  assert.deepEqual(projection.run_containers[0].pr_status, {
    state: 'merge-ready',
    merge_state: 'CLEAN',
    review_decision: 'APPROVED',
    auto_merge: false,
  });
  assert.deepEqual(projection.run_containers[0].repair, {
    status: 'scheduled',
    run_id: 'run-54-repair-1',
    reason: 'ci-failed',
  });
  assert.deepEqual(projection.run_containers[0].timeline, [
    { type: 'selected', at: '2026-06-23T23:00:00Z', summary: 'Selected #54.' },
    { type: 'pr.opened', at: '2026-06-23T23:10:00Z', summary: 'PR opened.' },
  ]);
  assert.deepEqual(projection.run_containers[0].issue_comments, ['https://github.com/justbill2020/Lambchop/issues/54#issuecomment-1']);
  assert.equal(projection.run_containers[0].work_log_path, 'runs/run-54/work-log.md');
  assert.deepEqual(projection.feedback.allowed_intents, ['approve', 'reject', 'revise', 'pause', 'resume', 'retry', 'reassign', 'escalate']);
  assert.deepEqual(projection.analytics, {
    retry_count: 1,
    validation_failures: 0,
    churned_files: ['docs/lambchop/dashboard.html'],
    time_to_pr_minutes: 18,
    blocker_count: 0,
    adapter_used: 'codex-cli',
    human_intervention_points: ['feedback:retry'],
  });
  assert.deepEqual(projection.policy_requests, [
    {
      action: 'policy-authorization-request',
      status: 'needs-human-approval',
      issue_number: 55,
      requested_capability: 'open-linked-pr',
    },
  ]);
});
