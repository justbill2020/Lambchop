import assert from 'node:assert/strict';
import test from 'node:test';

test('the MVPv1 proof keeps a second project visible without activating it when capacity is full', async () => {
  const { runSecondProjectAdmissionProof } = await import('../src/second-project-proof.mjs');

  const proof = runSecondProjectAdmissionProof();

  assert.equal(proof.activation.activated, false);
  assert.equal(proof.activation.reason, 'no_capacity');
  assert.deepEqual(proof.snapshot.projects.registered.map((project) => project.key), ['lambchop', 'client-beta']);
  assert.deepEqual(proof.snapshot.projects.active.map((project) => project.key), ['lambchop']);
});
