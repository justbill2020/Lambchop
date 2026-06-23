import path from 'node:path';

function defaultNow() {
  return new Date().toISOString();
}

function requireObject(value, name) {
  if (!value || typeof value !== 'object') {
    throw new Error(`${name} is required`);
  }
  return value;
}

function requireText(value, name) {
  if (!value || typeof value !== 'string') {
    throw new Error(`${name} is required`);
  }
  return value;
}

function requireIssueNumber(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error('taskBrief.issueNumber must be a positive integer');
  }
  return number;
}

function assertInside(root, candidate) {
  const relative = path.relative(root, candidate);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    return candidate;
  }

  throw new Error(`Worker worktree path is outside the managed sandbox root: ${candidate}`);
}

function normalizeRunRequest(request) {
  const taskBrief = requireObject(request.taskBrief, 'taskBrief');
  const workspace = requireObject(request.workspace, 'workspace');
  const policy = requireObject(request.policy, 'policy');
  const validation = request.validation ?? {};

  if (policy.allowGithubMutations) {
    throw new Error('Workers cannot directly mutate GitHub Issues or PRs');
  }

  const sandboxRoot = path.resolve(requireText(workspace.sandboxRoot, 'workspace.sandboxRoot'));
  const worktreePath = assertInside(
    sandboxRoot,
    path.resolve(requireText(workspace.worktreePath, 'workspace.worktreePath')),
  );

  return {
    adapter: requireText(request.adapter, 'adapter'),
    task: {
      issueNumber: requireIssueNumber(taskBrief.issueNumber),
      title: requireText(taskBrief.title, 'taskBrief.title'),
      instructions: taskBrief.instructions ?? '',
    },
    workspace: {
      sandboxRoot,
      worktreePath,
    },
    policy: {
      githubMutationsAllowed: false,
      allowedSideEffects: policy.allowedSideEffects ?? [],
    },
    validation: {
      expectedCommands: validation.expectedCommands ?? [],
    },
  };
}

function defaultRunId({ adapter, issueNumber, startedAt }) {
  return `${adapter}-issue-${issueNumber}-${startedAt.replace(/[:.]/g, '-')}`;
}

export function createFakeWorkerAdapter() {
  return {
    name: 'fake-worker',

    async run(context) {
      context.emit({
        type: 'worker.run.output',
        message: `Fake worker completed deterministic task #${context.task.issueNumber}.`,
      });
      context.emit({
        type: 'worker.run.validation',
        status: 'passed',
        commands: context.validation.expectedCommands,
      });

      return {
        status: 'succeeded',
        changedFiles: ['FAKE_WORKER_RESULT.md'],
        validation: {
          status: 'passed',
          commands: context.validation.expectedCommands,
        },
        blockers: [],
      };
    },
  };
}

export function createWorkerRuntime(options = {}) {
  const now = options.now ?? defaultNow;
  const emitRunEvent = options.emitRunEvent ?? (() => {});
  const adapters = new Map((options.adapters ?? [createFakeWorkerAdapter()])
    .map((adapter) => [adapter.name, adapter]));

  return {
    availableAdapters() {
      return [...adapters.keys()];
    },

    async runWorker(request) {
      const normalized = normalizeRunRequest(request);
      const adapter = adapters.get(normalized.adapter);
      if (!adapter) {
        throw new Error(`Unknown worker adapter: ${normalized.adapter}`);
      }

      const startedAt = now();
      const runId = request.runId ?? defaultRunId({
        adapter: adapter.name,
        issueNumber: normalized.task.issueNumber,
        startedAt,
      });
      const emit = (event) => emitRunEvent({
        run_id: runId,
        adapter: adapter.name,
        issue_number: normalized.task.issueNumber,
        timestamp: now(),
        ...event,
      });

      emit({
        type: 'worker.run.started',
        workspace: normalized.workspace,
      });

      const adapterResult = await adapter.run({
        runId,
        emit,
        task: normalized.task,
        workspace: normalized.workspace,
        policy: normalized.policy,
        validation: normalized.validation,
        github: null,
      });
      const finishedAt = now();
      const result = {
        runId,
        adapter: adapter.name,
        status: adapterResult.status ?? 'succeeded',
        task: normalized.task,
        workspace: normalized.workspace,
        policy: normalized.policy,
        changedFiles: adapterResult.changedFiles ?? [],
        validation: adapterResult.validation ?? { status: 'not_run', commands: [] },
        blockers: adapterResult.blockers ?? [],
        transcriptSummary: adapterResult.transcriptSummary ?? '',
        startedAt,
        finishedAt,
      };

      emit({
        type: 'worker.run.completed',
        status: result.status,
        changed_files: result.changedFiles,
        validation: result.validation,
        blockers: result.blockers,
      });

      return result;
    },
  };
}
