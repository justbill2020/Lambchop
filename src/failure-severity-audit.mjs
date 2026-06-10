function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const VALID_CATEGORIES = new Set([
  'workflow',
  'orchestrator',
  'agent-role',
  'dashboard-or-visibility',
  'capacity-or-heartbeat',
]);

const VALID_SEVERITIES = new Set(['P0', 'P1', 'P2', 'P3']);

export function createFailureSeverityAudit() {
  const failures = new Map();

  function recordTimeline(failure, entry) {
    failure.timeline.push(clone(entry));
    failure.currentSeverity = entry.severity;
  }

  function getFailureRecord(failureKey) {
    const failure = failures.get(failureKey);
    if (!failure) {
      throw new Error(`Unknown failure: ${failureKey}`);
    }
    return failure;
  }

  return {
    reportFailure({
      failureKey,
      category,
      summary,
      evidence,
      proposedSeverity,
      source,
      repromptOnlyRecovery = false,
    }) {
      if (!VALID_CATEGORIES.has(category)) {
        throw new Error(`Unknown failure category: ${category}`);
      }
      if (!VALID_SEVERITIES.has(proposedSeverity)) {
        throw new Error(`Unknown severity: ${proposedSeverity}`);
      }

      const failure = {
        failureKey,
        category,
        summary,
        blockedStateAllowed: repromptOnlyRecovery ? false : true,
        currentSeverity: proposedSeverity,
        timeline: [],
      };

      recordTimeline(failure, {
        severity: proposedSeverity,
        source,
        evidence,
      });

      failures.set(failureKey, failure);
      return clone(failure);
    },

    autoRaiseSeverity(failureKey, { severity, source, evidence }) {
      if (!VALID_SEVERITIES.has(severity)) {
        throw new Error(`Unknown severity: ${severity}`);
      }
      const failure = getFailureRecord(failureKey);
      recordTimeline(failure, { severity, source, evidence });
      return clone(failure);
    },

    overrideSeverity(failureKey, { severity, source, evidence }) {
      if (!VALID_SEVERITIES.has(severity)) {
        throw new Error(`Unknown severity: ${severity}`);
      }
      const failure = getFailureRecord(failureKey);
      recordTimeline(failure, { severity, source, evidence });
      return clone(failure);
    },

    getFailure(failureKey) {
      return clone(getFailureRecord(failureKey));
    },
  };
}
