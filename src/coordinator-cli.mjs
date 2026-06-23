import { readFile } from 'node:fs/promises';

import { createCoordinatorAssignment } from './coordinator-assignment.mjs';
import { createCoordinatorGithubSideEffects, createGhPullRequestClient, createGitBranchClient } from './coordinator-github-side-effects.mjs';
import { createDogfoodProofLoop } from './dogfood-proof-loop.mjs';
import { createDogfoodProofEvidence } from './dogfood-proof-evidence.mjs';
import { createFeedbackIntake } from './feedback-intake.mjs';
import { createPrAuthorizationIntake } from './pr-authorization-intake.mjs';
import { createPrAuthorizationRequest } from './pr-authorization-request.mjs';
import { createPrOwnershipLoop } from './pr-ownership-loop.mjs';
import { createMachinePeerRegistry } from './machine-peer-registry.mjs';
import { createManagedProjectRegistry } from './managed-project-registry.mjs';
import { createMvpPlanningLoop } from './mvp-planning-loop.mjs';
import { createProjectSandboxManager } from './project-sandbox-manager.mjs';
import { createRunEventLog } from './run-evidence.mjs';

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { command };

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    switch (token) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--repo':
        options.repository = rest[++index];
        break;
      case '--goal':
        options.goalIssueNumber = Number(rest[++index]);
        break;
      case '--north-star':
        options.northStarPath = rest[++index];
        break;
      case '--projects':
        options.projectsPath = rest[++index];
        break;
      case '--peers':
        options.peersPath = rest[++index];
        break;
      case '--runner':
        options.runnerId = rest[++index];
        break;
      case '--coordinator':
        options.coordinatorId = rest[++index];
        break;
      case '--sandbox-root':
        options.sandboxRoot = rest[++index];
        break;
      case '--project':
        options.projectSlug = rest[++index];
        break;
      case '--issue':
        options.issueNumber = Number(rest[++index]);
        break;
      case '--run':
        options.runId = rest[++index];
        break;
      case '--pr':
        options.pullRequestNumber = Number(rest[++index]);
        break;
      case '--source-checkout':
        options.sourceCheckout = rest[++index];
        break;
      case '--base-branch':
        options.baseBranch = rest[++index];
        break;
      case '--branch':
        options.branch = rest[++index];
        break;
      case '--adapter':
        options.adapter = rest[++index];
        break;
      default:
        throw new Error(`Unsupported coordinator option: ${token}`);
    }
  }

  return options;
}

function firstContentLine(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#')) ?? '';
}

function requireOption(value, name) {
  if (!value) {
    throw new Error(`Missing required option: ${name}`);
  }
  return value;
}

function defaultReadText(path) {
  return readFile(path, 'utf8');
}

export function createCoordinatorCli(options = {}) {
  const issueClient = options.issueClient;
  const sandboxManager = options.sandboxManager ?? createProjectSandboxManager();
  const runEventLog = options.runEventLog ?? createRunEventLog();
  const dogfoodProofLoop = options.dogfoodProofLoop ?? createDogfoodProofLoop({
    authorizationIntake: createPrAuthorizationIntake({ issueClient }),
    sideEffects: createCoordinatorGithubSideEffects({
      issueClient,
      gitClient: createGitBranchClient(),
      pullRequestClient: createGhPullRequestClient(),
      runEventLog,
    }),
  });
  const prOwnershipLoop = options.prOwnershipLoop ?? createPrOwnershipLoop({
    issueClient,
    pullRequestClient: createGhPullRequestClient(),
    runEventLog,
  });
  const readText = options.readText ?? defaultReadText;
  const writeStdout = options.writeStdout ?? ((text) => process.stdout.write(`${text}\n`));
  const writeStderr = options.writeStderr ?? ((text) => process.stderr.write(`${text}\n`));

  async function status(commandOptions) {
    const repository = requireOption(commandOptions.repository, '--repo');
    const goalIssueNumber = requireOption(commandOptions.goalIssueNumber, '--goal');
    const northStarPath = requireOption(commandOptions.northStarPath, '--north-star');
    const projectsPath = commandOptions.projectsPath ?? null;
    const dryRun = Boolean(commandOptions.dryRun);
    const productNorthStar = firstContentLine(await readText(northStarPath));
    const registry = projectsPath
      ? await createManagedProjectRegistry({ readText }).load(projectsPath)
      : null;
    const peerRegistry = commandOptions.peersPath
      ? await createMachinePeerRegistry({ readText }).load(commandOptions.peersPath)
      : null;
    const managedProjects = registry
      ? registry.projects.map((project) => ({
          slug: project.slug,
          name: project.name,
          repository: project.repository,
          default_branch: project.defaultBranch,
          dashboard: project.dashboard,
          policy: {
            source_of_truth: project.policy.sourceOfTruth,
            auto_merge: project.policy.autoMerge,
            worker_sandbox_required: project.policy.workerSandboxRequired,
          },
        }))
      : [{ repository }];
    const planningLoop = createMvpPlanningLoop({ issueClient });
    const feedbackIntake = createFeedbackIntake({ issueClient });
    const plan = await planningLoop.planFromGithub({ repository, goalIssueNumber });
    const feedback = await feedbackIntake.ingestFromGithub({
      repository,
      activeGoalIssue: goalIssueNumber,
      issueNumber: goalIssueNumber,
    });
    const peerIntents = peerRegistry
      ? createMachinePeerRegistry().assignmentIntents({
          peers: peerRegistry.peers,
          repository,
        })
      : commandOptions.runnerId
      ? [{
          runnerId: commandOptions.runnerId,
          repository,
          status: 'available',
          capabilities: ['node', 'gh'],
        }]
      : [];
    const assignment = createCoordinatorAssignment().assignNext({
      repository,
      coordinatorId: commandOptions.coordinatorId ?? 'local-coordinator',
      readyCandidates: plan.parallelizableCandidates,
      peerIntents,
    });
    const payload = {
      command: 'status',
      dry_run: dryRun,
      managed_projects: managedProjects,
      product_north_star: productNorthStar,
      mvp: {
        active_goal: plan.activeGoal,
        next_issue: plan.nextIssue,
        counts: plan.status.counts,
        blockers: plan.status.blockers,
        parallelizable_candidates: plan.status.parallelizable_candidates,
      },
      feedback: feedback.status,
      peers: peerRegistry
        ? peerRegistry.peers.map((peer) => ({
            runner_id: peer.runnerId,
            machine_label: peer.machineLabel,
            platform: peer.platform,
            health: peer.health,
            availability: peer.availability,
            capabilities: peer.capabilities,
            workspace_roots: peer.workspaceRoots,
          }))
        : [],
      assignment: assignment.status,
    };

    writeStdout(JSON.stringify(payload, null, 2));
    return { exitCode: 0, status: payload };
  }

  async function sandboxStatus(commandOptions) {
    const status = sandboxManager.projectSandboxStatus({
      sandboxRoot: requireOption(commandOptions.sandboxRoot, '--sandbox-root'),
      projectSlug: requireOption(commandOptions.projectSlug, '--project'),
    });
    const payload = {
      command: 'sandbox-status',
      sandbox: {
        project_slug: status.projectSlug,
        sandbox_root: status.sandboxRoot,
        project_sandbox_path: status.projectSandboxPath,
        worktrees_path: status.worktreesPath,
      },
    };

    writeStdout(JSON.stringify(payload, null, 2));
    return { exitCode: 0, status: payload };
  }

  async function prepareWorktree(commandOptions) {
    const status = await sandboxManager.createIssueWorktree({
      sandboxRoot: requireOption(commandOptions.sandboxRoot, '--sandbox-root'),
      projectSlug: requireOption(commandOptions.projectSlug, '--project'),
      issueNumber: requireOption(commandOptions.issueNumber, '--issue'),
      sourceCheckout: requireOption(commandOptions.sourceCheckout, '--source-checkout'),
      baseBranch: commandOptions.baseBranch ?? 'main',
    });
    const payload = {
      command: 'prepare-worktree',
      worktree: {
        project_slug: status.projectSlug,
        issue_number: status.issueNumber,
        branch: status.branch,
        project_sandbox_path: status.projectSandboxPath,
        worktree_path: status.worktreePath,
      },
    };

    writeStdout(JSON.stringify(payload, null, 2));
    return { exitCode: 0, status: payload };
  }

  async function dogfoodProof(commandOptions) {
    const repository = requireOption(commandOptions.repository, '--repo');
    const issueNumber = requireOption(commandOptions.issueNumber, '--issue');
    const runnerId = requireOption(commandOptions.runnerId, '--runner');
    const branch = requireOption(commandOptions.branch, '--branch');
    const adapter = requireOption(commandOptions.adapter, '--adapter');
    const input = {
      repository,
      issueNumber,
      runId: `run-${issueNumber}`,
      selectedIssue: {
        number: issueNumber,
        title: 'Dogfood one complete Lambchop issue-to-PR loop',
      },
      assignment: {
        assignment_state: 'assigned',
        assigned_runner: runnerId,
        assigned_issue: issueNumber,
      },
      peers: [{ runner_id: runnerId, health: 'active' }],
      runContainer: {
        worker: { adapter },
        validation: { status: 'passed', commands: [] },
        branch,
        pull_request: null,
        changed_files: [],
      },
      dashboard: { visible: true, feedbackQueueVisible: true },
      analytics: { validation_failures: 0, retry_count: 0, adapter_used: adapter },
      policy: { may_push: true, may_open_pr: false, auto_merge: false },
      baseBranch: commandOptions.baseBranch ?? 'main',
    };
    const dryRun = Boolean(commandOptions.dryRun);
    const result = dryRun
      ? await dogfoodProofLoop.dryCheck(input)
      : await dogfoodProofLoop.run(input);
    const policyRequest = createPrAuthorizationRequest().fromReadiness({
      issueNumber,
      repository,
      readiness: result,
      policy: input.policy,
    });
    const evidence = createDogfoodProofEvidence().fromDryCheck({
      issueNumber,
      runId: input.runId,
      runnerId,
      branch,
      adapter,
      result,
      policyRequest,
    });
    const payload = {
      command: 'dogfood-proof',
      dry_run: dryRun,
      result,
      evidence,
    };

    writeStdout(JSON.stringify(payload, null, 2));
    return { exitCode: 0, status: payload };
  }

  async function prStatus(commandOptions) {
    const result = await prOwnershipLoop.observePullRequest({
      repository: requireOption(commandOptions.repository, '--repo'),
      issueNumber: requireOption(commandOptions.issueNumber, '--issue'),
      runId: requireOption(commandOptions.runId, '--run'),
      pullRequestNumber: requireOption(commandOptions.pullRequestNumber, '--pr'),
    });
    const payload = {
      command: 'pr-status',
      result,
    };

    writeStdout(JSON.stringify(payload, null, 2));
    return { exitCode: 0, status: payload };
  }

  return {
    async run(argv) {
      try {
        const commandOptions = parseArgs(argv);
        if (commandOptions.command === 'status') {
          return await status(commandOptions);
        }
        if (commandOptions.command === 'sandbox-status') {
          return await sandboxStatus(commandOptions);
        }
        if (commandOptions.command === 'prepare-worktree') {
          return await prepareWorktree(commandOptions);
        }
        if (commandOptions.command === 'dogfood-proof') {
          return await dogfoodProof(commandOptions);
        }
        if (commandOptions.command === 'pr-status') {
          return await prStatus(commandOptions);
        }

        throw new Error(`Unsupported coordinator command: ${commandOptions.command ?? '(none)'}`);
      } catch (error) {
        writeStderr(error.message);
        return { exitCode: 2, error };
      }
    },
  };
}
