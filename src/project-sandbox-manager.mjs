import { spawn } from 'node:child_process';
import { mkdir as defaultMkdir } from 'node:fs/promises';
import path from 'node:path';

function defaultRunGit(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, {
      shell: false,
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
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const error = new Error(`git ${args.join(' ')} failed with exit code ${code}`);
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
}

function requireText(value, name) {
  if (!value || typeof value !== 'string') {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeRoot(sandboxRoot) {
  return path.resolve(requireText(sandboxRoot, 'sandboxRoot'));
}

function normalizeSourceCheckout(sourceCheckout) {
  return path.resolve(requireText(sourceCheckout, 'sourceCheckout'));
}

function normalizeProjectSlug(projectSlug) {
  const slug = requireText(projectSlug, 'projectSlug');
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    throw new Error(`Unsafe project slug: ${slug}`);
  }
  return slug;
}

function normalizeIssueNumber(issueNumber) {
  const number = Number(issueNumber);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error('issueNumber must be a positive integer');
  }
  return number;
}

function assertInside(root, candidate) {
  const relative = path.relative(root, candidate);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    return candidate;
  }

  throw new Error(`Path escapes Lambchop-managed sandbox root: ${candidate}`);
}

function pathsFor({ sandboxRoot, projectSlug, issueNumber }) {
  const root = normalizeRoot(sandboxRoot);
  const slug = normalizeProjectSlug(projectSlug);
  const projectSandboxPath = assertInside(root, path.join(root, 'projects', slug));
  const worktreesPath = assertInside(projectSandboxPath, path.join(projectSandboxPath, 'worktrees'));

  if (!issueNumber) {
    return {
      sandboxRoot: root,
      projectSlug: slug,
      projectSandboxPath,
      worktreesPath,
    };
  }

  const normalizedIssueNumber = normalizeIssueNumber(issueNumber);
  const branch = `codex/lambchop-issue-${normalizedIssueNumber}`;
  const worktreePath = assertInside(
    worktreesPath,
    path.join(worktreesPath, `issue-${normalizedIssueNumber}`),
  );

  return {
    sandboxRoot: root,
    projectSlug: slug,
    projectSandboxPath,
    worktreesPath,
    issueNumber: normalizedIssueNumber,
    branch,
    worktreePath,
  };
}

export function createProjectSandboxManager(options = {}) {
  const mkdir = options.mkdir ?? defaultMkdir;
  const runGit = options.runGit ?? defaultRunGit;

  return {
    projectSandboxStatus({ sandboxRoot, projectSlug }) {
      const sandboxPaths = pathsFor({ sandboxRoot, projectSlug });
      return {
        projectSlug: sandboxPaths.projectSlug,
        sandboxRoot: sandboxPaths.sandboxRoot,
        projectSandboxPath: sandboxPaths.projectSandboxPath,
        worktreesPath: sandboxPaths.worktreesPath,
      };
    },

    issueWorktreeStatus({ sandboxRoot, projectSlug, issueNumber }) {
      const sandboxPaths = pathsFor({ sandboxRoot, projectSlug, issueNumber });
      return {
        projectSlug: sandboxPaths.projectSlug,
        issueNumber: sandboxPaths.issueNumber,
        branch: sandboxPaths.branch,
        projectSandboxPath: sandboxPaths.projectSandboxPath,
        worktreePath: sandboxPaths.worktreePath,
      };
    },

    async ensureProjectSandbox({ sandboxRoot, projectSlug }) {
      const status = this.projectSandboxStatus({ sandboxRoot, projectSlug });
      await mkdir(status.projectSandboxPath, { recursive: true });
      return status;
    },

    async createIssueWorktree({
      sandboxRoot,
      projectSlug,
      issueNumber,
      sourceCheckout,
      baseBranch = 'main',
    }) {
      await this.ensureProjectSandbox({ sandboxRoot, projectSlug });
      const status = this.issueWorktreeStatus({ sandboxRoot, projectSlug, issueNumber });
      await mkdir(status.worktreePath, { recursive: true });
      await runGit([
        '-C',
        normalizeSourceCheckout(sourceCheckout),
        'worktree',
        'add',
        '-B',
        status.branch,
        status.worktreePath,
        requireText(baseBranch, 'baseBranch'),
      ]);
      return status;
    },

    async removeIssueWorktree({ sandboxRoot, projectSlug, issueNumber, sourceCheckout, force = false }) {
      const status = this.issueWorktreeStatus({ sandboxRoot, projectSlug, issueNumber });
      await runGit([
        '-C',
        normalizeSourceCheckout(sourceCheckout),
        'worktree',
        'remove',
        ...(force ? ['--force'] : []),
        status.worktreePath,
      ]);
      return status;
    },
  };
}
