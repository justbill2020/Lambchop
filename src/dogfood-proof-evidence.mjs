function normalizeBlocker(blocker) {
  return {
    type: blocker.type,
    message: blocker.message,
    next_step: blocker.nextStep ?? blocker.next_step ?? null,
  };
}

export function createDogfoodProofEvidence() {
  return {
    fromDryCheck({ issueNumber, runId, branch, adapter, result, policyRequest }) {
      const blockers = (result.blockers ?? []).map(normalizeBlocker);

      return {
        run_container: {
          run_id: runId,
          issue_number: issueNumber,
          worker: { adapter },
          branch,
          pull_request: null,
          validation: {
            status: result.status,
            failures: 0,
          },
          blockers,
        },
        policy_requests: policyRequest ? [policyRequest] : [],
        analytics: {
          retry_count: 0,
          validation_failures: 0,
          churned_files: [],
          time_to_pr_minutes: null,
          blocker_count: blockers.length,
          adapter_used: adapter,
          human_intervention_points: blockers.some((blocker) => blocker.type === 'pr-policy-disabled')
            ? ['policy:open-linked-pr']
            : [],
        },
      };
    },
  };
}
