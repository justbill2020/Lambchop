import assert from 'node:assert/strict';
import test from 'node:test';

import { createDogfoodProofLoop } from '../src/dogfood-proof-loop.mjs';

function baseInput() {
  return {
    repository: 'justbill2020/Lambchop',
    issueNumber: 55,
    runId: 'run-55',
    selectedIssue: { number: 55, title: 'Dogfood one complete Lambchop issue-to-PR loop' },
    assignment: { assignment_state: 'assigned', assigned_runner: 'bill-windows', assigned_issue: 55 },
    peers: [{ runner_id: 'bill-windows', health: 'active' }],
    runContainer: {
      worker: { adapter: 'codex-cli' },
      validation: { status: 'passed', commands: ['node --test tests/dogfood-proof-loop.test.mjs'] },
      branch: 'codex/lambchop-issue-55',
      pull_request: null,
      changed_files: ['src/dogfood-proof-loop.mjs'],
    },
    dashboard: { visible: true, feedbackQueueVisible: true },
    analytics: { validation_failures: 0, retry_count: 0, adapter_used: 'codex-cli' },
    policy: { may_push: true, may_open_pr: false, auto_merge: false },
  };
}

test('dogfood proof loop blocks without direct PR authorization and does not publish', async () => {
  const calls = [];
  const loop = createDogfoodProofLoop({
    authorizationIntake: {
      async fromGithub() {
        return {
          status: 'not-authorized',
          issue_number: 55,
          capability: 'open-linked-pr',
          may_open_pr: false,
          auto_merge: false,
        };
      },
    },
    sideEffects: {
      async publishCompletedRun() {
        calls.push('publishCompletedRun');
      },
    },
  });

  const result = await loop.run(baseInput());

  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.authorization, {
    status: 'not-authorized',
    issue_number: 55,
    capability: 'open-linked-pr',
    may_open_pr: false,
    auto_merge: false,
  });
  assert.deepEqual(result.blockers.map((blocker) => blocker.type), ['pr-policy-disabled']);
  assert.deepEqual(calls, []);
});

test('dogfood proof loop publishes a linked PR only when direct PR authorization exists', async () => {
  const publishCalls = [];
  const loop = createDogfoodProofLoop({
    authorizationIntake: {
      async fromGithub({ repository, issueNumber }) {
        assert.equal(repository, 'justbill2020/Lambchop');
        assert.equal(issueNumber, 55);
        return {
          status: 'authorized',
          issue_number: 55,
          capability: 'open-linked-pr',
          may_open_pr: true,
          auto_merge: false,
          source_comment_url: 'https://github.com/justbill2020/Lambchop/issues/55#issuecomment-approval',
          scope: 'single-dogfood-proof-run',
        };
      },
    },
    sideEffects: {
      async publishCompletedRun(request) {
        publishCalls.push(request);
        return {
          status: 'pr-opened',
          pullRequest: { url: 'https://github.com/justbill2020/Lambchop/pull/101', state: 'OPEN' },
          autoMerge: false,
        };
      },
    },
  });

  const result = await loop.run(baseInput());

  assert.equal(result.status, 'pr-opened');
  assert.equal(result.pullRequest.url, 'https://github.com/justbill2020/Lambchop/pull/101');
  assert.equal(publishCalls.length, 1);
  assert.deepEqual(publishCalls[0], {
    repository: 'justbill2020/Lambchop',
    issueNumber: 55,
    runId: 'run-55',
    branch: 'codex/lambchop-issue-55',
    baseBranch: 'main',
    title: 'Dogfood one complete Lambchop issue-to-PR loop',
    summary: 'Dogfood proof run completed through Lambchop coordinator.',
    validation: { status: 'passed', commands: ['node --test tests/dogfood-proof-loop.test.mjs'] },
    changedFiles: ['src/dogfood-proof-loop.mjs'],
    allowPush: true,
    allowPullRequest: true,
    autoMerge: false,
  });
});

test('dogfood proof loop dry-check reports current authorization without publishing', async () => {
  const loop = createDogfoodProofLoop({
    authorizationIntake: {
      async fromGithub() {
        return {
          status: 'not-authorized',
          issue_number: 55,
          capability: 'open-linked-pr',
          may_open_pr: false,
          auto_merge: false,
        };
      },
    },
    sideEffects: {
      async publishCompletedRun() {
        throw new Error('dry-check must not publish');
      },
    },
  });

  const result = await loop.dryCheck(baseInput());

  assert.equal(result.status, 'blocked');
  assert.equal(result.authorization.status, 'not-authorized');
  assert.deepEqual(result.blockers.map((blocker) => blocker.type), ['pr-policy-disabled']);
});
