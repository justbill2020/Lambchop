import { spawn } from 'node:child_process';

function nowIso() {
  return new Date().toISOString();
}

function createCodexCliAdapter(options = {}) {
  const codexCliPath = options.codexCliPath ?? process.env.LAMBCHOP_CODEX_CLI_PATH ?? 'codex';

  return {
    name: 'codex-cli',
    buildCommand(runRequest) {
      return {
        command: codexCliPath,
        args: runRequest.extraArgs ?? [],
      };
    },
  };
}

export function createCliAgentRuntime(options = {}) {
  const adapters = new Map();
  const codexAdapter = createCodexCliAdapter(options);
  adapters.set(codexAdapter.name, codexAdapter);

  return {
    availableAdapters() {
      return [...adapters.keys()];
    },

    startRun(runRequest) {
      const adapter = adapters.get(runRequest.adapter);
      if (!adapter) {
        throw new Error(`Unknown CLI agent adapter: ${runRequest.adapter}`);
      }

      const command = adapter.buildCommand(runRequest);
      const child = spawn(command.command, command.args, {
        cwd: runRequest.cwd ?? process.cwd(),
        env: { ...process.env, ...runRequest.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const run = {
        adapter: adapter.name,
        storyKey: runRequest.storyKey,
        prompt: runRequest.prompt,
        command,
        status: 'running',
        startedAt: nowIso(),
        finishedAt: null,
        exitCode: null,
        stdout: '',
        stderr: '',
        pid: child.pid ?? null,
      };

      child.stdout.on('data', (chunk) => {
        run.stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        run.stderr += chunk.toString();
      });

      run.completed = new Promise((resolve, reject) => {
        child.on('error', (error) => {
          run.status = 'failed';
          run.finishedAt = nowIso();
          reject(error);
        });

        child.on('close', (code) => {
          run.exitCode = code;
          run.finishedAt = nowIso();
          run.status = code === 0 ? 'succeeded' : 'failed';
          resolve(run);
        });
      });

      return run;
    },
  };
}
