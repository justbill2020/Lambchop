import assert from 'node:assert/strict';
import test from 'node:test';

import { createPrAuthorizationRequest } from '../src/pr-authorization-request.mjs';

test('PR authorization request turns dogfood PR policy blocker into a reviewable dashboard request', () => {
  const request = createPrAuthorizationRequest().fromReadiness({
    issueNumber: 55,
    repository: 'justbill2020/Lambchop',
    readiness: {
      status: 'blocked',
      blockers: [
        {
          type: 'pr-policy-disabled',
          message: 'Dogfood proof requires opening a linked PR, but policy has may_open_pr=false.',
          nextStep: 'Bill or the workflow must explicitly allow PR opening for the dogfood proof run.',
        },
      ],
    },
    policy: {
      may_push: true,
      may_open_pr: false,
      auto_merge: false,
    },
  });

  assert.deepEqual(request, {
    action: 'policy-authorization-request',
    status: 'needs-human-approval',
    repository: 'justbill2020/Lambchop',
    issue_number: 55,
    requested_capability: 'open-linked-pr',
    reason: 'Dogfood proof requires opening a linked PR, but policy has may_open_pr=false.',
    constraints: {
      may_push: true,
      may_open_pr: false,
      auto_merge: false,
      requested_auto_merge: false,
    },
    approval_comment: '/lambchop-feedback\nintent: approve\ntarget: #55\nmessage: allow one coordinator-owned linked PR for the dogfood proof; auto-merge remains disabled.',
    next_step: 'Bill or the workflow must explicitly allow PR opening for the dogfood proof run.',
  });
});

test('PR authorization request is not created when readiness has no PR policy blocker', () => {
  const request = createPrAuthorizationRequest().fromReadiness({
    issueNumber: 55,
    repository: 'justbill2020/Lambchop',
    readiness: {
      status: 'ready',
      blockers: [],
    },
    policy: {
      may_push: true,
      may_open_pr: true,
      auto_merge: false,
    },
  });

  assert.equal(request, null);
});
