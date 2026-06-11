import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const serverModuleUrl = pathToFileURL(join(process.cwd(), 'docs', 'lambchop', 'dashboard-server', 'server.mjs')).href;

test('dashboard status payload declares the web truth/debug surface and Godot adapter split', async () => {
  const { statusPayload } = await import(`${serverModuleUrl}?case=truth-debug-${Date.now()}`);
  const statusRoot = mkdtempSync(join(tmpdir(), 'lambchop-truth-debug-'));

  writeFileSync(join(statusRoot, 'state.json'), JSON.stringify({
    project: {
      slug: 'lambchop',
      name: 'Lambchop',
      purpose: 'Autonomous coding team workflow',
    },
    work_items: [],
  }));
  writeFileSync(join(statusRoot, 'dashboard-data.json'), JSON.stringify({ work_items: [] }));
  writeFileSync(join(statusRoot, 'backoff.json'), JSON.stringify({ status: 'ACTIVE' }));
  writeFileSync(join(statusRoot, 'progress.md'), '## Run\n- Validation passed.\n');
  writeFileSync(join(statusRoot, 'scheduled-work-plan.md'), '- Keep the dashboard evidence current.\n');

  const payload = await statusPayload({ root: statusRoot });

  assert.deepEqual(payload.operator_surfaces, {
    shared_evidence: [
      'state.json',
      'dashboard-data.json',
      'progress.md',
      'scheduled-work-plan.md',
      'backoff.json',
    ],
    web_dashboard: {
      role: 'truth/debug operator surface',
      contract: 'Reads and queues workflow evidence without inventing production-floor state.',
    },
    godot_prototype: {
      role: 'expressive production-floor adapter',
      contract: 'Projects the same evidence into a studio-floor metaphor and must not outrank the web dashboard on truth/debug questions.',
    },
  });
});
