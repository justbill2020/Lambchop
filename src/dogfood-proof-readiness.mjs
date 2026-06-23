function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function addBlocker(blockers, type, message, nextStep) {
  blockers.push({ type, message, nextStep });
}

export function createDogfoodProofReadiness() {
  return {
    evaluate(input) {
      const satisfied = [];
      const blockers = [];
      const policy = input.policy ?? {};
      const runContainer = input.runContainer ?? {};

      if (input.selectedIssue?.number) {
        satisfied.push('github_issue_selected');
      } else {
        addBlocker(
          blockers,
          'issue-not-selected',
          'Dogfood proof requires a real Lambchop GitHub issue selection.',
          'Select a real GitHub issue through the coordinator planning loop.',
        );
      }

      if (
        input.assignment?.assignment_state === 'assigned'
        && input.assignment?.assigned_runner
        && (input.peers ?? []).some((peer) => peer.runner_id === input.assignment.assigned_runner && peer.health === 'active')
      ) {
        satisfied.push('registered_peer_assigned');
      } else {
        addBlocker(
          blockers,
          'peer-not-assigned',
          'Dogfood proof requires assignment to an active registered peer.',
          'Register an active peer and let the coordinator assign the selected issue.',
        );
      }

      if (runContainer.worker?.adapter && runContainer.validation?.status) {
        satisfied.push('sandboxed_worker_recorded');
      } else {
        addBlocker(
          blockers,
          'worker-run-missing',
          'Dogfood proof requires a sandboxed worker run with validation evidence.',
          'Run the selected issue through a Codex or Claude worker adapter inside a managed worktree.',
        );
      }

      if (input.dashboard?.visible && input.dashboard?.feedbackQueueVisible) {
        satisfied.push('dashboard_visibility_recorded');
      } else {
        addBlocker(
          blockers,
          'dashboard-proof-missing',
          'Dogfood proof requires dashboard visibility for the run and feedback queue.',
          'Expose the run container and feedback state through the MVP dashboard.',
        );
      }

      if (input.analytics?.adapter_used && hasValue(input.analytics.validation_failures)) {
        satisfied.push('analytics_recorded');
      } else {
        addBlocker(
          blockers,
          'analytics-missing',
          'Dogfood proof requires session analytics for validation, retry/churn, adapter, and time-to-PR.',
          'Record analytics v0 for the dogfood run.',
        );
      }

      if (policy.auto_merge === false) {
        satisfied.push('auto_merge_disabled');
      } else {
        addBlocker(
          blockers,
          'auto-merge-enabled',
          'Dogfood proof must not auto-merge by default.',
          'Disable auto-merge for the dogfood proof run.',
        );
      }

      if (!policy.may_open_pr) {
        addBlocker(
          blockers,
          'pr-policy-disabled',
          'Dogfood proof requires opening a linked PR, but policy has may_open_pr=false.',
          'Bill or the workflow must explicitly allow PR opening for the dogfood proof run.',
        );
      } else if (runContainer.pull_request?.url) {
        satisfied.push('linked_pr_opened');
      } else {
        addBlocker(
          blockers,
          'linked-pr-missing',
          'Dogfood proof requires an opened linked PR.',
          'Let the coordinator open a linked PR for the completed worker branch.',
        );
      }

      if (hasValue(input.analytics?.time_to_pr_minutes)) {
        satisfied.push('time_to_pr_recorded');
      }

      return {
        status: blockers.length ? 'blocked' : 'ready',
        satisfied,
        blockers,
      };
    },
  };
}
