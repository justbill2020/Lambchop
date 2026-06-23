import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { queueDashboardCommand, statusPayload } from '../docs/lambchop/dashboard-server/server.mjs';

async function writeJson(root, fileName, value) {
  await writeFile(join(root, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test('dashboard status payload includes MVP orchestration visibility fields', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lambchop-dashboard-mvp-'));
  await writeJson(root, 'state.json', {
    project: { name: 'Lambchop', slug: 'lambchop', phase: 'mvp' },
    work_items: [],
    last_run: null,
  });
  await writeJson(root, 'dashboard-data.json', {
    managed_projects: [
      {
        slug: 'lambchop',
        name: 'Lambchop',
        repository: 'justbill2020/Lambchop',
        dashboard: { role: 'first-managed-project' },
      },
    ],
    mvp: {
      active_goal: { number: 42, title: 'Dogfood Lambchop as the first managed AI engineering project' },
      next_issue: { number: 54, title: 'Build MVP single-pane dashboard with feedback controls and analytics v0' },
      counts: { child_issues: 13, ready: 1, blocked: 1, done: 11, human: 0 },
      blockers: [{ number: 55, title: 'Dogfood one complete Lambchop issue-to-PR loop', blocked_by: [54] }],
      parallelizable_candidates: [{ number: 54, title: 'Build MVP single-pane dashboard with feedback controls and analytics v0' }],
    },
    peers: [{ runner_id: 'bill-windows', machine_label: 'Windows workstation', health: 'active' }],
    assignment: { assignment_state: 'assigned', assigned_issue: 54, assigned_runner: 'bill-windows' },
    run_containers: [{ run_id: 'run-54', worker: { adapter: 'codex-cli' }, validation: { status: 'passed' } }],
    feedback: { allowed_intents: ['approve', 'reject', 'revise', 'pause', 'resume', 'retry', 'reassign', 'escalate'], queue: [] },
    analytics: { retry_count: 1, validation_failures: 0, churned_files: ['docs/lambchop/dashboard.html'], blocker_count: 0 },
    policy_requests: [{ action: 'policy-authorization-request', status: 'needs-human-approval', issue_number: 55 }],
  });
  await writeJson(root, 'backoff.json', {});
  await writeJson(root, 'dashboard-control-requests.json', { version: 1, requests: [] });
  await writeFile(join(root, 'progress.md'), '');
  await writeFile(join(root, 'scheduled-work-plan.md'), '');

  const status = await statusPayload({ root });

  assert.equal(status.mvp.active_goal.number, 42);
  assert.equal(status.mvp.next_issue.number, 54);
  assert.equal(status.peers[0].runner_id, 'bill-windows');
  assert.equal(status.assignment.assigned_runner, 'bill-windows');
  assert.equal(status.run_containers[0].worker.adapter, 'codex-cli');
  assert.equal(status.analytics.retry_count, 1);
  assert.deepEqual(status.policy_requests, [{ action: 'policy-authorization-request', status: 'needs-human-approval', issue_number: 55 }]);
  assert.deepEqual(status.feedback.allowed_intents, ['approve', 'reject', 'revise', 'pause', 'resume', 'retry', 'reassign', 'escalate']);
});

test('dashboard validates typed feedback requests before queueing them', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lambchop-feedback-'));

  const queued = await queueDashboardCommand({
    action: 'feedback',
    intent: 'retry',
    target: '#54',
    message: 'Retry the dashboard projection run.',
    requested_by: 'dashboard',
  }, { root });

  assert.equal(queued.action, 'feedback');
  assert.equal(queued.intent, 'retry');
  assert.equal(queued.target, '#54');
  await assert.rejects(
    () => queueDashboardCommand({
      action: 'feedback',
      intent: 'delete-host-files',
      target: '#54',
    }, { root }),
    /Unsupported feedback intent/,
  );
});
