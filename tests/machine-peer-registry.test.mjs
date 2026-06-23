import assert from 'node:assert/strict';
import test from 'node:test';

import { createMachinePeerRegistry } from '../src/machine-peer-registry.mjs';

test('machine peer registry loads active and stale peers without exposing raw local paths or secrets', async () => {
  const registry = createMachinePeerRegistry({
    now: () => '2026-06-23T23:30:00.000Z',
    async readText(path) {
      assert.equal(path, 'docs/lambchop/runner-peers.json');
      return JSON.stringify({
        version: 1,
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
            last_seen_at: '2026-06-23T23:29:30.000Z',
            secret_names: ['GITHUB_TOKEN'],
          },
          {
            runner_id: 'bill-mac',
            machine_label: 'MacBook',
            platform: 'macos',
            capabilities: ['node', 'gh', 'claude-cli'],
            workspace_roots: [
              {
                label: 'mac-sandbox-root',
                path: '/Users/bill/.lambchop/sandboxes',
              },
            ],
            availability: {
              status: 'available',
              repositories: ['justbill2020/Lambchop'],
              load: 1,
            },
            active_assignments: [],
            last_seen_at: '2026-06-23T22:00:00.000Z',
          },
        ],
      });
    },
  });

  const loaded = await registry.load('docs/lambchop/runner-peers.json');

  assert.deepEqual(loaded.peers, [
    {
      runnerId: 'bill-windows',
      machineLabel: 'Windows workstation',
      platform: 'windows',
      capabilities: ['node', 'gh', 'codex-cli'],
      workspaceRoots: [{ label: 'lambchop-sandbox-root' }],
      availability: {
        status: 'available',
        repositories: ['justbill2020/Lambchop'],
        load: 0,
      },
      activeAssignments: [],
      health: 'active',
      lastSeenAt: '2026-06-23T23:29:30.000Z',
    },
    {
      runnerId: 'bill-mac',
      machineLabel: 'MacBook',
      platform: 'macos',
      capabilities: ['node', 'gh', 'claude-cli'],
      workspaceRoots: [{ label: 'mac-sandbox-root' }],
      availability: {
        status: 'available',
        repositories: ['justbill2020/Lambchop'],
        load: 1,
      },
      activeAssignments: [],
      health: 'stale',
      lastSeenAt: '2026-06-23T22:00:00.000Z',
    },
  ]);
});

test('machine peer registry creates assignment intents only for active available peers', async () => {
  const registry = createMachinePeerRegistry({
    now: () => '2026-06-23T23:30:00.000Z',
    async readText() {
      return JSON.stringify({
        peers: [
          {
            runner_id: 'bill-windows',
            platform: 'windows',
            capabilities: ['node', 'gh', 'codex-cli'],
            availability: {
              status: 'available',
              repositories: ['justbill2020/Lambchop'],
              load: 0,
            },
            last_seen_at: '2026-06-23T23:29:30.000Z',
          },
          {
            runner_id: 'busy-runner',
            platform: 'linux',
            capabilities: ['node', 'gh'],
            availability: {
              status: 'busy',
              repositories: ['justbill2020/Lambchop'],
              load: 2,
            },
            last_seen_at: '2026-06-23T23:29:30.000Z',
          },
        ],
      });
    },
  });

  const loaded = await registry.load('docs/lambchop/runner-peers.json');

  assert.deepEqual(registry.assignmentIntents({
    peers: loaded.peers,
    repository: 'justbill2020/Lambchop',
  }), [
    {
      runnerId: 'bill-windows',
      repository: 'justbill2020/Lambchop',
      status: 'available',
      capabilities: ['node', 'gh', 'codex-cli'],
      load: 0,
    },
  ]);
});
