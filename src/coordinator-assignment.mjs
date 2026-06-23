function addMinutes(isoTimestamp, minutes) {
  return new Date(Date.parse(isoTimestamp) + minutes * 60 * 1000).toISOString();
}

function branchFor(issueNumber) {
  return `codex/lambchop-issue-${issueNumber}`;
}

function summarizeIssue(issue) {
  return {
    number: issue.number,
    title: issue.title,
    url: issue.url,
  };
}

function eligiblePeer({ repository, peerIntents }) {
  return peerIntents.find((peer) => (
    peer.repository === repository
    && peer.status === 'available'
  )) ?? null;
}

function waitingStatus() {
  return {
    assignment_state: 'waiting-for-peer',
    assigned_issue: null,
    assigned_runner: null,
    branch: null,
    expires_at: null,
  };
}

export function createCoordinatorAssignment(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());

  return {
    assignNext({
      repository,
      coordinatorId,
      leaseMinutes = 120,
      readyCandidates = [],
      peerIntents = [],
    }) {
      const issue = readyCandidates[0] ?? null;
      const peer = eligiblePeer({ repository, peerIntents });
      if (!issue || !peer) {
        return {
          assignment: null,
          status: waitingStatus(),
        };
      }

      const claimedAt = now();
      const expiresAt = addMinutes(claimedAt, leaseMinutes);
      const branch = branchFor(issue.number);
      const assignment = {
        issue: summarizeIssue(issue),
        repository,
        runner: peer.runnerId,
        branch,
        coordinator: coordinatorId,
        status: 'assigned',
        claimedAt,
        expiresAt,
        source: 'github-issues',
      };

      return {
        assignment,
        status: {
          assignment_state: 'assigned',
          assigned_issue: issue.number,
          assigned_runner: peer.runnerId,
          branch,
          expires_at: expiresAt,
        },
      };
    },
  };
}
