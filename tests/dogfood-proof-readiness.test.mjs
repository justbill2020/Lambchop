import assert from 'node:assert/strict';
import test from 'node:test';

import { createDogfoodProofReadiness } from '../src/dogfood-proof-readiness.mjs';

test('dogfood proof readiness reports the PR policy blocker before claiming issue-to-PR proof', () => {
  const readiness = createDogfoodProofReadiness().evaluate({
    selectedIssue: { number: 55, title: 'Dogfood one complete Lambchop issue-to-PR loop' },
    assignment: { assignment_state: 'assigned', assigned_runner: 'bill-windows', assigned_issue: 55 },
    peers: [{ runner_id: 'bill-windows', health: 'active' }],
    runContainer: {
      worker: { adapter: 'codex-cli' },
      validation: { status: 'passed' },
      branch: 'codex/lambchop-issue-55',
      pull_request: null,
    },
    dashboard: { visible: true, feedbackQueueVisible: true },
    analytics: { validation_failures: 0, retry_count: 0, adapter_used: 'codex-cli' },
    policy: { may_push: true, may_open_pr: false, auto_merge: false },
  });

  assert.equal(readiness.status, 'blocked');
  assert.deepEqual(readiness.satisfied, [
    'github_issue_selected',
    'registered_peer_assigned',
    'sandboxed_worker_recorded',
    'dashboard_visibility_recorded',
    'analytics_recorded',
    'auto_merge_disabled',
  ]);
  assert.deepEqual(readiness.blockers, [
    {
      type: 'pr-policy-disabled',
      message: 'Dogfood proof requires opening a linked PR, but policy has may_open_pr=false.',
      nextStep: 'Bill or the workflow must explicitly allow PR opening for the dogfood proof run.',
    },
  ]);
});

test('dogfood proof readiness passes when the full issue-to-PR lifecycle evidence is present', () => {
  const readiness = createDogfoodProofReadiness().evaluate({
    selectedIssue: { number: 55, title: 'Dogfood one complete Lambchop issue-to-PR loop' },
    assignment: { assignment_state: 'assigned', assigned_runner: 'bill-windows', assigned_issue: 55 },
    peers: [{ runner_id: 'bill-windows', health: 'active' }],
    runContainer: {
      worker: { adapter: 'claude-cli' },
      validation: { status: 'passed' },
      branch: 'codex/lambchop-issue-55',
      pull_request: { url: 'https://github.com/justbill2020/Lambchop/pull/99', state: 'OPEN' },
    },
    dashboard: { visible: true, feedbackQueueVisible: true },
    analytics: { validation_failures: 0, retry_count: 1, adapter_used: 'claude-cli', time_to_pr_minutes: 12 },
    policy: { may_push: true, may_open_pr: true, auto_merge: false },
  });

  assert.equal(readiness.status, 'ready');
  assert.deepEqual(readiness.blockers, []);
  assert.ok(readiness.satisfied.includes('linked_pr_opened'));
  assert.ok(readiness.satisfied.includes('time_to_pr_recorded'));
});
