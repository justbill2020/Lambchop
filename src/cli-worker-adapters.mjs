import { spawn } from 'node:child_process';

function buildPrompt(context) {
  return JSON.stringify({
    task_brief: {
      issue_number: context.task.issueNumber,
      title: context.task.title,
      instructions: context.task.instructions,
    },
    policy: {
      github_mutations_allowed: context.policy.githubMutationsAllowed,
      allowed_side_effects: context.policy.allowedSideEffects,
    },
    workspace: {
      worktree_path: context.workspace.worktreePath,
    },
    validation: {
      expected_commands: context.validation.expectedCommands,
    },
  });
}

function summarizeTranscript(stdout, stderr, taskTitle) {
  const lines = `${stdout}\n${stderr}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
  return [taskTitle, ...lines].join('\n');
}

function parseChangedFiles(stdout) {
  const match = stdout.match(/^CHANGED_FILES:(.+)$/m);
  if (!match) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function runProcess({ command, args, cwd, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function createCliWorkerAdapter({
  name,
  command,
  launcherArgs = [],
  buildArgs,
  env,
}) {
  return {
    name,

    async run(context) {
      const prompt = buildPrompt(context);
      const args = buildArgs({ launcherArgs, prompt });
      context.emit({
        type: 'worker.run.output',
        message: `${name} launched`,
        command,
        args,
      });

      const completed = await runProcess({
        command,
        args,
        cwd: context.workspace.worktreePath,
        env,
      });
      const transcriptSummary = summarizeTranscript(
        completed.stdout,
        completed.stderr,
        context.task.title,
      );

      if (completed.code !== 0) {
        return {
          status: 'blocked',
          changedFiles: [],
          validation: {
            status: 'not_run',
            commands: context.validation.expectedCommands,
          },
          blockers: [{
            type: 'cli-exit',
            message: `CLI exited with code ${completed.code}`,
            stderr: completed.stderr.trim(),
          }],
          transcriptSummary,
        };
      }

      return {
        status: 'succeeded',
        changedFiles: parseChangedFiles(completed.stdout),
        validation: {
          status: 'not_run',
          commands: context.validation.expectedCommands,
        },
        blockers: [],
        transcriptSummary,
      };
    },
  };
}

export function createCodexCliWorkerAdapter(options = {}) {
  return createCliWorkerAdapter({
    name: 'codex-cli',
    command: options.command ?? process.env.LAMBCHOP_CODEX_CLI_PATH ?? 'codex',
    launcherArgs: options.launcherArgs ?? [],
    env: options.env,
    buildArgs({ launcherArgs, prompt }) {
      return [
        ...launcherArgs,
        'exec',
        '--sandbox',
        'danger-full-access',
        prompt,
      ];
    },
  });
}

export function createClaudeCliWorkerAdapter(options = {}) {
  return createCliWorkerAdapter({
    name: 'claude-cli',
    command: options.command ?? process.env.LAMBCHOP_CLAUDE_CLI_PATH ?? 'claude',
    launcherArgs: options.launcherArgs ?? [],
    env: options.env,
    buildArgs({ launcherArgs, prompt }) {
      return [
        ...launcherArgs,
        '-p',
        prompt,
      ];
    },
  });
}
