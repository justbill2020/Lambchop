function first(value, fallback = null) {
  return Array.isArray(value) && value.length ? value[0] : fallback;
}

function snakePeer(peer) {
  return {
    runner_id: peer.runnerId ?? peer.runner_id,
    machine_label: peer.machineLabel ?? peer.machine_label,
    platform: peer.platform,
    health: peer.health,
    availability: peer.availability,
    capabilities: peer.capabilities ?? [],
  };
}

function snakeRunContainer(container) {
  const sandbox = container.sandbox ?? {};
  return {
    run_id: container.runId ?? container.run_id,
    issue_number: container.issueNumber ?? container.issue_number,
    issue: container.issue ?? null,
    sandbox: {
      sandbox_id: sandbox.sandboxId ?? sandbox.sandbox_id ?? null,
      project_sandbox_path: sandbox.projectSandboxPath ?? sandbox.project_sandbox_path,
      worktree_path: sandbox.worktreePath ?? sandbox.worktree_path,
      mounted_paths: sandbox.mountedPaths ?? sandbox.mounted_paths ?? [],
      allowed_network: sandbox.allowedNetwork ?? sandbox.allowed_network ?? [],
      allowed_secrets: sandbox.allowedSecrets ?? sandbox.allowed_secrets ?? [],
    },
    worker: container.worker ?? {},
    branch: container.branch ?? null,
    pull_request: container.pullRequest ?? container.pull_request ?? null,
    pr_status: container.prStatus ?? container.pr_status ?? null,
    repair: container.repair ?? null,
    validation: container.validation ?? { status: 'not recorded' },
    timeline: container.timeline ?? [],
    issue_comments: container.issueComments ?? container.issue_comments ?? [],
    work_log_path: container.workLogPath ?? container.work_log_path ?? null,
    blockers: container.blockers ?? [],
  };
}

function snakeAnalytics(analytics = {}) {
  return {
    retry_count: analytics.retryCount ?? analytics.retry_count ?? 0,
    validation_failures: analytics.validationFailures ?? analytics.validation_failures ?? 0,
    churned_files: analytics.churnedFiles ?? analytics.churned_files ?? [],
    time_to_pr_minutes: analytics.timeToPrMinutes ?? analytics.time_to_pr_minutes ?? null,
    blocker_count: analytics.blockerCount ?? analytics.blocker_count ?? 0,
    adapter_used: analytics.adapterUsed ?? analytics.adapter_used ?? null,
    human_intervention_points: analytics.humanInterventionPoints ?? analytics.human_intervention_points ?? [],
  };
}

export function createMvpDashboardProjection() {
  return {
    project(input) {
      const managedProject = first(input.managedProjects, {});
      const planning = input.planning ?? {};
      const feedback = input.feedback ?? {};

      return {
        project: {
          slug: managedProject.slug ?? 'lambchop',
          name: managedProject.name ?? 'Lambchop',
          repository: managedProject.repository,
          role: managedProject.dashboard?.role ?? managedProject.role ?? null,
        },
        mvp: {
          active_goal: planning.activeGoal ?? planning.active_goal ?? null,
          next_issue: planning.nextIssue ?? planning.next_issue ?? null,
          counts: planning.status?.counts ?? planning.counts ?? {},
          blockers: planning.status?.blockers ?? planning.blockers ?? [],
          parallelizable_candidates: planning.status?.parallelizable_candidates
            ?? planning.parallelizableCandidates
            ?? planning.parallelizable_candidates
            ?? [],
        },
        peers: (input.peers ?? []).map(snakePeer),
        assignment: input.assignment ?? null,
        run_containers: (input.runContainers ?? input.run_containers ?? []).map(snakeRunContainer),
        feedback: {
          allowed_intents: feedback.allowedIntents ?? feedback.allowed_intents ?? [],
          queue: feedback.queue ?? [],
        },
        analytics: snakeAnalytics(input.analytics),
        policy_requests: input.policyRequests ?? input.policy_requests ?? [],
      };
    },
  };
}
