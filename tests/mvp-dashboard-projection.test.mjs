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
        sandbox: {
          projectSandboxPath: 'C:/Users/BillMartin/.lambchop/sandboxes/projects/lambchop',
          worktreePath: 'C:/Users/BillMartin/.lambchop/sandboxes/projects/lambchop/worktrees/issue-54',
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
