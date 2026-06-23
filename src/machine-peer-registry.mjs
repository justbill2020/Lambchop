import { readFile } from 'node:fs/promises';

function defaultReadText(path) {
  return readFile(path, 'utf8');
}

function minutesBetween(leftIso, rightIso) {
  return (Date.parse(rightIso) - Date.parse(leftIso)) / 60000;
}

function peerHealth({ peer, nowIso, activeWindowMinutes }) {
  if (!peer.last_seen_at) {
    return 'stale';
  }

  return minutesBetween(peer.last_seen_at, nowIso) <= activeWindowMinutes ? 'active' : 'stale';
}

function normalizeWorkspaceRoots(roots = []) {
  return roots.map((root) => ({ label: root.label }));
}

function normalizePeer(peer, { nowIso, activeWindowMinutes }) {
  return {
    runnerId: peer.runner_id,
    machineLabel: peer.machine_label ?? peer.runner_id,
    platform: peer.platform,
    capabilities: peer.capabilities ?? [],
    workspaceRoots: normalizeWorkspaceRoots(peer.workspace_roots),
    availability: {
      status: peer.availability?.status ?? 'unavailable',
      repositories: peer.availability?.repositories ?? [],
      load: peer.availability?.load ?? 0,
    },
    activeAssignments: peer.active_assignments ?? [],
    health: peerHealth({ peer, nowIso, activeWindowMinutes }),
    lastSeenAt: peer.last_seen_at ?? null,
  };
}

export function createMachinePeerRegistry(options = {}) {
  const readText = options.readText ?? defaultReadText;
  const now = options.now ?? (() => new Date().toISOString());
  const activeWindowMinutes = options.activeWindowMinutes ?? 10;

  return {
    async load(path) {
      const raw = JSON.parse(await readText(path));
      const nowIso = now();
      return {
        version: raw.version ?? 1,
        peers: (raw.peers ?? []).map((peer) => normalizePeer(peer, {
          nowIso,
          activeWindowMinutes,
        })),
      };
    },

    assignmentIntents({ peers, repository }) {
      return peers
        .filter((peer) => (
          peer.health === 'active'
          && peer.availability.status === 'available'
          && peer.availability.repositories.includes(repository)
        ))
        .sort((left, right) => left.availability.load - right.availability.load)
        .map((peer) => ({
          runnerId: peer.runnerId,
          repository,
          status: 'available',
          capabilities: peer.capabilities,
          load: peer.availability.load,
        }));
    },
  };
}
