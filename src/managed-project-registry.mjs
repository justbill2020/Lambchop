import { readFile } from 'node:fs/promises';

function defaultReadText(path) {
  return readFile(path, 'utf8');
}

function camelLabels(labels = {}) {
  return {
    readyForAgent: labels.ready_for_agent ?? 'ready-for-agent',
    readyForHuman: labels.ready_for_human ?? 'ready-for-human',
  };
}

function normalizeProject(project) {
  return {
    slug: project.slug,
    name: project.name,
    repository: project.github_repository,
    localCheckout: project.local_checkout ?? null,
    defaultBranch: project.default_branch ?? 'main',
    labels: camelLabels(project.labels),
    policy: {
      sourceOfTruth: project.policy?.source_of_truth ?? 'github-issues-and-prs',
      autoMerge: Boolean(project.policy?.auto_merge),
      workerSandboxRequired: project.policy?.worker_sandbox_required !== false,
    },
    dashboard: {
      title: project.dashboard?.title ?? project.name,
      role: project.dashboard?.role ?? 'managed-project',
    },
  };
}

function assertUniqueSlugs(projects) {
  const seen = new Set();
  for (const project of projects) {
    if (seen.has(project.slug)) {
      throw new Error(`Duplicate managed project slug: ${project.slug}`);
    }
    seen.add(project.slug);
  }
}

export function createManagedProjectRegistry(options = {}) {
  const readText = options.readText ?? defaultReadText;

  return {
    async load(path) {
      const raw = JSON.parse(await readText(path));
      const projects = (raw.projects ?? []).map(normalizeProject);
      assertUniqueSlugs(projects);

      return {
        version: raw.version ?? 1,
        sourceOfTruth: raw.source_of_truth ?? 'github-issues-and-prs',
        isWorkTruth: false,
        note: raw.note ?? 'Local registry is configuration/cache, not work truth.',
        projects,
      };
    },
  };
}
