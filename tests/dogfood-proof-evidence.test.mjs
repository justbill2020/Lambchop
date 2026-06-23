import assert from 'node:assert/strict';
import test from 'node:test';

import { createDogfoodProofEvidence } from '../src/dogfood-proof-evidence.mjs';

test('dogfood proof evidence records blocked dry-check results for dashboard visibility', () => {
  const evidence = createDogfoodProofEvidence().fromDryCheck({
    issueNumber: 55,
    runId: 'run-55',
    runnerId: 'bill-windows',
    branch: 'codex/lambchop-issue-55',
    adapter: 'codex-cli',
    result: {
      status: 'blocked',
      authorization: {
        status: 'not-authorized',
        issue_number: 55,
        capability: 'open-linked-pr',
        may_open_pr: false,
        auto_merge: false,
      },
      satisfied: [
        'github_issue_selected',
        'registered_peer_assigned',
        'sandboxed_worker_recorded',
        'dashboard_visibility_recorded',
        'analytics_recorded',
        'auto_merge_disabled',
      ],
      blockers: [
        {
          type: 'pr-policy-disabled',
          message: 'Dogfood proof requires opening a linked PR, but policy has may_open_pr=false.',
          nextStep: 'Bill or the workflow must explicitly allow PR opening for the dogfood proof run.',
        },
      ],
    },
    policyRequest: {
      action: 'policy-authorization-request',
      status: 'needs-human-approval',
      issue_number: 55,
      requested_capability: 'open-linked-pr',
    },
  });

  assert.deepEqual(evidence.run_container, {
    run_id: 'run-55',
    issue_number: 55,
    worker: { adapter: 'codex-cli' },
    branch: 'codex/lambchop-issue-55',
    pull_request: null,
    validation: { status: 'blocked', failures: 0 },
    blockers: [
      {
        type: 'pr-policy-disabled',
        message: 'Dogfood proof requires opening a linked PR, but policy has may_open_pr=false.',
        next_step: 'Bill or the workflow must explicitly allow PR opening for the dogfood proof run.',
      },
    ],
  });
  assert.deepEqual(evidence.policy_requests, [
    {
      action: 'policy-authorization-request',
      status: 'needs-human-approval',
      issue_number: 55,
      requested_capability: 'open-linked-pr',
    },
  ]);
  assert.deepEqual(evidence.analytics, {
    retry_count: 0,
    validation_failures: 0,
    churned_files: [],
    time_to_pr_minutes: null,
    blocker_count: 1,
    adapter_used: 'codex-cli',
    human_intervention_points: ['policy:open-linked-pr'],
  });
});
