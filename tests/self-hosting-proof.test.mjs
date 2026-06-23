import assert from 'node:assert/strict';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

test('Lambchop can prove the MVPv0 self-hosting path through the Codex CLI-backed orchestration spine', async () => {
  const { runSelfHostingProof } = await import('../src/self-hosting-proof.mjs');

  const fixtureCli = join(repoRoot, 'tests', 'fixtures', 'fake-codex-cli.mjs');
  const proof = await runSelfHostingProof({
    codexCliPath: process.execPath,
    codexCliArgs: [fixtureCli, '--json'],
    storyKey: 'story-self-hosting',
  });

  assert.equal(proof.project.key, 'lambchop');
  assert.equal(proof.project.status, 'active');
  assert.equal(proof.story.key, 'story-self-hosting');
  assert.equal(proof.story.floorState, 'workshop');
  assert.equal(proof.run.adapter, 'codex-cli');
  assert.equal(proof.run.status, 'succeeded');
  assert.equal(proof.run.exitCode, 0);
  assert.equal(proof.materialProgress.result, 'pass');
  assert.equal(proof.dashboard.last_run.active_work_item, 'story-self-hosting');
  assert.match(proof.dashboard.last_run.summary, /Completed self-hosting slice/i);
  assert.equal(proof.dashboard.projectFloor.stories[0].key, 'story-self-hosting');
  assert.equal(proof.dashboard.projectFloor.stories[0].placement.station, 'build-bay');
  assert.equal(proof.dashboard.projectFloor.stories[0].mission.type, 'implement');
  assert.equal(proof.meeting.mode, 'party');
});
