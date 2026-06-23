function findPrPolicyBlocker(readiness) {
  return (readiness?.blockers ?? []).find((blocker) => blocker.type === 'pr-policy-disabled') ?? null;
}

export function createPrAuthorizationRequest() {
  return {
    fromReadiness({ issueNumber, repository, readiness, policy }) {
      const blocker = findPrPolicyBlocker(readiness);
      if (!blocker) {
        return null;
      }

      return {
        action: 'policy-authorization-request',
        status: 'needs-human-approval',
        repository,
        issue_number: issueNumber,
        requested_capability: 'open-linked-pr',
        reason: blocker.message,
        constraints: {
          may_push: policy?.may_push === true,
          may_open_pr: policy?.may_open_pr === true,
          auto_merge: policy?.auto_merge === true,
          requested_auto_merge: false,
        },
        approval_comment: [
          '/lambchop-feedback',
          'intent: approve',
          `target: #${issueNumber}`,
          'message: allow one coordinator-owned linked PR for the dogfood proof; auto-merge remains disabled.',
        ].join('\n'),
        next_step: blocker.nextStep,
      };
    },
  };
}
