import { execFile } from 'node:child_process';

function runGhProcess(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile('gh', args, {
      cwd: options.cwd ?? process.cwd(),
      maxBuffer: 1024 * 1024 * 10,
    }, (error, stdout, stderr) => {
      if (error) {
        error.stderr = stderr;
        reject(error);
        return;
      }

      resolve(stdout.trim());
    });

    if (options.input) {
      child.stdin.end(options.input);
    }
  });
}

export function createGhIssueClient(options = {}) {
  const runGh = options.runGh ?? runGhProcess;

  return {
    async listIssues({ repository, state = 'open', limit = 200 }) {
      const output = await runGh([
        'issue',
        'list',
        '--repo',
        repository,
        '--state',
        state,
        '--limit',
        String(limit),
        '--json',
        'number,title,state,labels,body,url',
      ]);

      return JSON.parse(output);
    },

    async createComment({ repository, issueNumber, body }) {
      const output = await runGh([
        'issue',
        'comment',
        String(issueNumber),
        '--repo',
        repository,
        '--body-file',
        '-',
      ], { input: body });

      return { url: output.trim() };
    },

    async listComments({ repository, issueNumber }) {
      const output = await runGh([
        'issue',
        'view',
        String(issueNumber),
        '--repo',
        repository,
        '--comments',
        '--json',
        'comments',
      ]);

      return JSON.parse(output).comments ?? [];
    },
  };
}
