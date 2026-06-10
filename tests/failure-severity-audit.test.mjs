import assert from 'node:assert/strict';
import test from 'node:test';

test('failure severity audit records proposals, auto-raises hard signals, and tracks human overrides', async () => {
  const { createFailureSeverityAudit } = await import('../src/failure-severity-audit.mjs');

  const audit = createFailureSeverityAudit();

  const failure = audit.reportFailure({
    failureKey: 'failure-1',
    category: 'workflow',
    summary: 'Needed a human reprompt to continue.',
    evidence: 'Reprompt-only recovery is a Lambchop failure.',
    proposedSeverity: 'P2',
    source: 'agent-proposed',
    repromptOnlyRecovery: true,
  });

  assert.equal(failure.category, 'workflow');
  assert.equal(failure.blockedStateAllowed, false);
  assert.equal(failure.currentSeverity, 'P2');

  audit.autoRaiseSeverity('failure-1', {
    severity: 'P1',
    source: 'controller-raised',
    evidence: 'Failure now harms an active project.',
  });

  audit.overrideSeverity('failure-1', {
    severity: 'P3',
    source: 'human-overridden',
    evidence: 'Operator downgraded after review.',
  });

  const snapshot = audit.getFailure('failure-1');

  assert.equal(snapshot.currentSeverity, 'P3');
  assert.deepEqual(snapshot.timeline.map((entry) => entry.source), [
    'agent-proposed',
    'controller-raised',
    'human-overridden',
  ]);
  assert.deepEqual(snapshot.timeline.map((entry) => entry.severity), ['P2', 'P1', 'P3']);
  assert.match(snapshot.timeline[0].evidence, /Lambchop failure/i);
  assert.match(snapshot.timeline[2].evidence, /downgraded/i);
});
