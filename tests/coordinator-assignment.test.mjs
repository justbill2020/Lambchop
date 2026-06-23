import assert from 'node:assert/strict';
import test from 'node:test';

import { createCoordinatorAssignment } from '../src/coordinator-assignment.mjs';

test('coordinator assignment accepts peer intent and creates an issue-linked lease for the next ready candidate', () => {
  const assignment = createCoordinatorAssignment({
    now: () => '2026-06-23T23:00:00.000Z',
  });

  const result = assignment.assignNext({
    repository: 'justbill2020/Lambchop',
    coordinatorId: 'coordinator-windows',
    leaseMinutes: 120,
    readyCandidates: [
      {
        number: 47,
        title: 'Implement GitHub Issues intake and coordinator assignment leases',
        url: 'https://github.com/justbill2020/Lambchop/issues/47',
      },
      {
        number: 48,
        title: 'Add machine peer registry and heartbeat for dogfood runners',
        url: 'https://github.com/justbill2020/Lambchop/issues/48',
      },
    ],
    peerIntents: [
      {
        runnerId: 'bill-windows',
        repository: 'justbill2020/Lambchop',
        status: 'available',
        capabilities: ['node', 'gh', 'codex-cli'],
      },
    ],
  });

  assert.deepEqual(result.assignment, {
    issue: {
      number: 47,
      title: 'Implement GitHub Issues intake and coordinator assignment leases',
      url: 'https://github.com/justbill2020/Lambchop/issues/47',
    },
    repository: 'justbill2020/Lambchop',
    runner: 'bill-windows',
    branch: 'codex/lambchop-issue-47',
    coordinator: 'coordinator-windows',
    status: 'assigned',
    claimedAt: '2026-06-23T23:00:00.000Z',
    expiresAt: '2026-06-24T01:00:00.000Z',
    source: 'github-issues',
  });
  assert.deepEqual(result.status, {
    assignment_state: 'assigned',
    assigned_issue: 47,
    assigned_runner: 'bill-windows',
    branch: 'codex/lambchop-issue-47',
    expires_at: '2026-06-24T01:00:00.000Z',
  });
});

test('coordinator assignment does not assign when no peer intent is available', () => {
  const assignment = createCoordinatorAssignment({
    now: () => '2026-06-23T23:00:00.000Z',
  });

  const result = assignment.assignNext({
    repository: 'justbill2020/Lambchop',
    coordinatorId: 'coordinator-windows',
    readyCandidates: [
      {
        number: 47,
        title: 'Implement GitHub Issues intake and coordinator assignment leases',
        url: 'https://github.com/justbill2020/Lambchop/issues/47',
      },
    ],
    peerIntents: [],
  });

  assert.equal(result.assignment, null);
  assert.deepEqual(result.status, {
    assignment_state: 'waiting-for-peer',
    assigned_issue: null,
    assigned_runner: null,
    branch: null,
    expires_at: null,
  });
});

test('coordinator assignment skips peer intents for other repositories', () => {
  const assignment = createCoordinatorAssignment({
    now: () => '2026-06-23T23:00:00.000Z',
  });

  const result = assignment.assignNext({
    repository: 'justbill2020/Lambchop',
    coordinatorId: 'coordinator-windows',
    readyCandidates: [
      {
        number: 47,
        title: 'Implement GitHub Issues intake and coordinator assignment leases',
        url: 'https://github.com/justbill2020/Lambchop/issues/47',
      },
    ],
    peerIntents: [
      {
        runnerId: 'bill-mac',
        repository: 'other/repo',
        status: 'available',
        capabilities: ['node', 'gh'],
      },
    ],
  });

  assert.equal(result.assignment, null);
  assert.equal(result.status.assignment_state, 'waiting-for-peer');
});
