import assert from 'node:assert/strict';
import test from 'node:test';

import { createManagedProjectRegistry } from '../src/managed-project-registry.mjs';

test('managed project registry loads Lambchop as the first managed project from configuration', async () => {
  const registry = createManagedProjectRegistry({
    async readText(path) {
      assert.equal(path, 'docs/lambchop/managed-projects.json');
      return JSON.stringify({
        version: 1,
        source_of_truth: 'github-issues-and-prs',
        note: 'Local registry is configuration/cache, not work truth.',
        projects: [
          {
            slug: 'lambchop',
            name: 'Lambchop',
            github_repository: 'justbill2020/Lambchop',
            local_checkout: 'C:/Users/BillMartin/dev/Lambchop',
            default_branch: 'main',
            labels: {
              ready_for_agent: 'ready-for-agent',
              ready_for_human: 'ready-for-human',
            },
            policy: {
              source_of_truth: 'github-issues-and-prs',
              auto_merge: false,
              worker_sandbox_required: true,
            },
            dashboard: {
              title: 'Lambchop',
              role: 'first-managed-project',
            },
          },
        ],
      });
    },
  });

  const loaded = await registry.load('docs/lambchop/managed-projects.json');

  assert.equal(loaded.sourceOfTruth, 'github-issues-and-prs');
  assert.equal(loaded.isWorkTruth, false);
  assert.deepEqual(loaded.projects, [
    {
      slug: 'lambchop',
      name: 'Lambchop',
      repository: 'justbill2020/Lambchop',
      localCheckout: 'C:/Users/BillMartin/dev/Lambchop',
      defaultBranch: 'main',
      labels: {
        readyForAgent: 'ready-for-agent',
        readyForHuman: 'ready-for-human',
      },
      policy: {
        sourceOfTruth: 'github-issues-and-prs',
        autoMerge: false,
        workerSandboxRequired: true,
      },
      dashboard: {
        title: 'Lambchop',
        role: 'first-managed-project',
      },
    },
  ]);
});

test('managed project registry rejects duplicate project slugs', async () => {
  const registry = createManagedProjectRegistry({
    async readText() {
      return JSON.stringify({
        projects: [
          { slug: 'lambchop', name: 'Lambchop', github_repository: 'justbill2020/Lambchop' },
          { slug: 'lambchop', name: 'Duplicate', github_repository: 'example/Duplicate' },
        ],
      });
    },
  });

  await assert.rejects(
    () => registry.load('docs/lambchop/managed-projects.json'),
    /Duplicate managed project slug: lambchop/,
  );
});
