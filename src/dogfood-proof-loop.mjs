import { createDogfoodProofReadiness } from './dogfood-proof-readiness.mjs';

function withAuthorizedPrPolicy(policy, authorization) {
  return {
    ...policy,
    may_open_pr: authorization.status === 'authorized' && authorization.may_open_pr === true,
    auto_merge: false,
  };
}

export function createDogfoodProofLoop(options = {}) {
  const authorizationIntake = options.authorizationIntake;
  const sideEffects = options.sideEffects;
  const readiness = options.readiness ?? createDogfoodProofReadiness();

  async function evaluate(input) {
    const authorization = await authorizationIntake.fromGithub({
      repository: input.repository,
      issueNumber: input.issueNumber,
    });
    const effectivePolicy = withAuthorizedPrPolicy(input.policy, authorization);
    const proof = readiness.evaluate({
      selectedIssue: input.selectedIssue,
      assignment: input.assignment,
      peers: input.peers,
      runContainer: {
        ...input.runContainer,
        pull_request: authorization.status === 'authorized'
          ? { url: 'pending-coordinator-pr', state: 'PENDING' }
          : input.runContainer?.pull_request,
      },
      dashboard: input.dashboard,
      analytics: input.analytics,
      policy: effectivePolicy,
    });

    return { authorization, effectivePolicy, proof };
  }

  return {
    async dryCheck(input) {
      const { authorization, proof } = await evaluate(input);
      return {
        status: proof.status,
        authorization,
        satisfied: proof.satisfied,
        blockers: proof.blockers,
      };
    },

    async run(input) {
      const { authorization, effectivePolicy, proof } = await evaluate(input);

      if (proof.status === 'blocked') {
        return {
          status: 'blocked',
          authorization,
          satisfied: proof.satisfied,
          blockers: proof.blockers,
        };
      }

      const publishResult = await sideEffects.publishCompletedRun({
        repository: input.repository,
        issueNumber: input.issueNumber,
        runId: input.runId,
        branch: input.runContainer.branch,
        baseBranch: input.baseBranch ?? 'main',
        title: input.selectedIssue.title,
        summary: 'Dogfood proof run completed through Lambchop coordinator.',
        validation: input.runContainer.validation,
        changedFiles: input.runContainer.changed_files ?? input.runContainer.changedFiles ?? [],
        allowPush: effectivePolicy.may_push === true,
        allowPullRequest: effectivePolicy.may_open_pr === true,
        autoMerge: false,
      });

      return {
        ...publishResult,
        authorization,
        satisfied: proof.satisfied,
      };
    },
  };
}
