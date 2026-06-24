import assert from 'node:assert/strict';
import test from 'node:test';

import { createProductionFloorProjection } from '../src/production-floor-projection.mjs';

test('production-floor projection maps story-owned work into office, workshop zones, and blocked lanes', async () => {
  const projection = createProductionFloorProjection().projectFloor({
    project: {
      name: 'Lambchop',
      slug: 'lambchop',
    },
    stories: [
      {
        key: 'story-office',
        title: 'Shape the production floor',
        floorState: 'office',
        activeMissionKey: 'mission-brief',
        acceptedOutcomes: [],
      },
      {
        key: 'story-build',
        title: 'Implement build zone projection',
        floorState: 'workshop',
        activeMissionKey: 'mission-build',
        acceptedOutcomes: [],
      },
      {
        key: 'story-blocked',
        title: 'Resolve human blocker',
        floorState: 'blocked',
        activeMissionKey: 'mission-blocked',
        acceptedOutcomes: [],
      },
    ],
    missions: [
      { key: 'mission-brief', storyKey: 'story-office', type: 'brief', status: 'active' },
      { key: 'mission-build', storyKey: 'story-build', type: 'implement', status: 'active' },
      { key: 'mission-blocked', storyKey: 'story-blocked', type: 'repair', status: 'active' },
    ],
    evidence: [
      { type: 'validation_passed', storyKey: 'story-build', at: '2026-06-11T15:00:00Z', summary: 'Build proof passed.' },
      { type: 'human_blocked', storyKey: 'story-blocked', at: '2026-06-11T15:05:00Z', summary: 'Waiting on Bill decision.' },
    ],
  });

  assert.equal(projection.project.slug, 'lambchop');
  assert.deepEqual(projection.regions.office.storyKeys, ['story-office']);
  assert.deepEqual(projection.regions.workshop.zones.build.storyKeys, ['story-build']);
  assert.deepEqual(projection.regions.workshop.zones.asset.storyKeys, []);
  assert.deepEqual(projection.regions.workshop.zones.integration.storyKeys, []);
  assert.deepEqual(projection.regions.blocked.storyKeys, ['story-blocked']);

  assert.deepEqual(
    projection.stories.map((story) => ({
      key: story.key,
      region: story.placement.region,
      zone: story.placement.zone,
      missionType: story.mission?.type ?? null,
      validation: story.validation,
      blocker: story.blocker,
    })),
    [
      {
        key: 'story-office',
        region: 'office',
        zone: 'planning',
        missionType: 'brief',
        validation: 'unknown',
        blocker: null,
      },
      {
        key: 'story-build',
        region: 'workshop',
        zone: 'build',
        missionType: 'implement',
        validation: 'passed',
        blocker: null,
      },
      {
        key: 'story-blocked',
        region: 'blocked',
        zone: 'blocked',
        missionType: 'repair',
        validation: 'unknown',
        blocker: 'Waiting on Bill decision.',
      },
    ],
  );
});

test('production-floor projection preserves handoff states while mapping asset and integration work to workshop zones', async () => {
  const projection = createProductionFloorProjection().projectFloor({
    project: {
      name: 'Lambchop',
      slug: 'lambchop',
    },
    stories: [
      {
        key: 'story-handoff-out',
        title: 'Hand story into workshop',
        floorState: 'handoff-to-workshop',
        activeMissionKey: 'mission-prototype',
        acceptedOutcomes: [],
      },
      {
        key: 'story-asset',
        title: 'Produce floor art',
        floorState: 'workshop',
        activeMissionKey: 'mission-asset',
        acceptedOutcomes: [],
      },
      {
        key: 'story-handoff-back',
        title: 'Return story to office',
        floorState: 'handoff-to-office',
        activeMissionKey: 'mission-validate',
        acceptedOutcomes: [],
      },
    ],
    missions: [
      { key: 'mission-prototype', storyKey: 'story-handoff-out', type: 'prototype', status: 'active' },
      { key: 'mission-asset', storyKey: 'story-asset', type: 'asset', status: 'active' },
      { key: 'mission-validate', storyKey: 'story-handoff-back', type: 'validate', status: 'active' },
    ],
    evidence: [],
  });

  assert.deepEqual(
    projection.stories.map((story) => ({
      key: story.key,
      floorState: story.floorState,
      region: story.placement.region,
      zone: story.placement.zone,
      missionType: story.mission?.type ?? null,
    })),
    [
      {
        key: 'story-handoff-out',
        floorState: 'handoff-to-workshop',
        region: 'office',
        zone: 'planning',
        missionType: 'prototype',
      },
      {
        key: 'story-asset',
        floorState: 'workshop',
        region: 'workshop',
        zone: 'asset',
        missionType: 'asset',
      },
      {
        key: 'story-handoff-back',
        floorState: 'handoff-to-office',
        region: 'workshop',
        zone: 'integration',
        missionType: 'validate',
      },
    ],
  );

  assert.deepEqual(projection.regions.office.storyKeys, ['story-handoff-out']);
  assert.deepEqual(projection.regions.workshop.zones.asset.storyKeys, ['story-asset']);
  assert.deepEqual(projection.regions.workshop.zones.integration.storyKeys, ['story-handoff-back']);
});

test('production-floor projection extends projectFloor with two-story studio semantics', async () => {
  const projection = createProductionFloorProjection().projectFloor({
    project: {
      name: 'Lambchop',
      slug: 'lambchop',
    },
    stories: [
      {
        key: 'story-office',
        title: 'Shape the office brief',
        floorState: 'office',
        activeMissionKey: 'mission-brief',
        acceptedOutcomes: [],
      },
      {
        key: 'story-handoff',
        title: 'Hand planning to build',
        floorState: 'handoff-to-workshop',
        activeMissionKey: 'mission-plan',
        acceptedOutcomes: [],
      },
      {
        key: 'story-build',
        title: 'Build downstairs slice',
        floorState: 'workshop',
        activeMissionKey: 'mission-build',
        acceptedOutcomes: [],
      },
    ],
    missions: [
      { key: 'mission-brief', storyKey: 'story-office', type: 'brief', status: 'active' },
      { key: 'mission-plan', storyKey: 'story-handoff', type: 'prototype', status: 'active' },
      { key: 'mission-build', storyKey: 'story-build', type: 'implement', status: 'active' },
    ],
    evidence: [],
  });

  assert.deepEqual(projection.studio.floors, {
    upstairs: {
      label: 'Office',
      roomKeys: ['office'],
      storyKeys: ['story-office', 'story-handoff'],
    },
    downstairs: {
      label: 'Workshop',
      roomKeys: ['workshop'],
      storyKeys: ['story-build'],
    },
  });

  assert.deepEqual(
    projection.stories.map((story) => ({
      key: story.key,
      floor: story.placement.floor,
      room: story.placement.room,
      station: story.placement.station,
      handoffTarget: story.placement.handoffTarget,
      crewLocation: story.crewLocation,
    })),
    [
      {
        key: 'story-office',
        floor: 'upstairs',
        room: 'office',
        station: 'briefing-desk',
        handoffTarget: null,
        crewLocation: {
          floor: 'upstairs',
          room: 'office',
          station: 'briefing-desk',
        },
      },
      {
        key: 'story-handoff',
        floor: 'upstairs',
        room: 'office',
        station: 'story-shaping-desk',
        handoffTarget: {
          floor: 'downstairs',
          room: 'workshop',
          station: 'build-bay',
        },
        crewLocation: {
          floor: 'upstairs',
          room: 'office',
          station: 'story-shaping-desk',
        },
      },
      {
        key: 'story-build',
        floor: 'downstairs',
        room: 'workshop',
        station: 'build-bay',
        handoffTarget: null,
        crewLocation: {
          floor: 'downstairs',
          room: 'workshop',
          station: 'build-bay',
        },
      },
    ],
  );
});

test('production-floor projection gives blocked stories a blocked crew posture in the studio model', async () => {
  const projection = createProductionFloorProjection().projectFloor({
    project: {
      name: 'Lambchop',
      slug: 'lambchop',
    },
    stories: [
      {
        key: 'story-blocked-waiting',
        title: 'Waiting on Bill decision',
        floorState: 'blocked',
        activeMissionKey: 'mission-repair',
        acceptedOutcomes: [],
      },
    ],
    missions: [
      { key: 'mission-repair', storyKey: 'story-blocked-waiting', type: 'repair', status: 'active' },
    ],
    evidence: [
      {
        type: 'human_blocked',
        storyKey: 'story-blocked-waiting',
        at: '2026-06-11T18:15:00Z',
        summary: 'Waiting for Bill to choose the next prototype direction.',
      },
    ],
  });

  assert.deepEqual(projection.studio.floors.downstairs.storyKeys, ['story-blocked-waiting']);
  assert.deepEqual(
    projection.stories.map((story) => ({
      key: story.key,
      floor: story.placement.floor,
      room: story.placement.room,
      station: story.placement.station,
      blocker: story.blocker,
      blockedPosture: story.blockedPosture,
      crewLocation: story.crewLocation,
    })),
    [
      {
        key: 'story-blocked-waiting',
        floor: 'downstairs',
        room: 'workshop',
        station: 'blocked-bay',
        blocker: 'Waiting for Bill to choose the next prototype direction.',
        blockedPosture: 'waiting-on-human',
        crewLocation: {
          floor: 'downstairs',
          room: 'workshop',
          station: 'blocked-bay',
          posture: 'waiting-on-human',
        },
      },
    ],
  );
});

test('production-floor evidence summary prefers latest valid timestamp over malformed evidence', async () => {
  const projection = createProductionFloorProjection().projectFloor({
    project: {
      name: 'Lambchop',
      slug: 'lambchop',
    },
    stories: [
      {
        key: 'story-evidence',
        title: 'Keep evidence truthful',
        floorState: 'workshop',
        activeMissionKey: 'mission-build',
        acceptedOutcomes: [],
      },
    ],
    missions: [
      { key: 'mission-build', storyKey: 'story-evidence', type: 'implement', status: 'active' },
    ],
    evidence: [
      { type: 'validation_failed', storyKey: 'story-evidence', at: '2026-06-18T10:00:00Z', summary: 'Older valid evidence.' },
      { type: 'agent_note', storyKey: 'story-evidence', at: 'not-a-date', summary: 'Malformed timestamp should not win.' },
      { type: 'validation_passed', storyKey: 'story-evidence', at: '2026-06-18T12:00:00Z', summary: 'Newest valid evidence.' },
    ],
  });

  assert.equal(projection.stories[0].evidenceSummary, 'Newest valid evidence.');
});

test('production-floor projection exposes MVP visual state, assigned agents, run, and evidence summaries for Godot', async () => {
  const projection = createProductionFloorProjection().projectFloor({
    project: {
      name: 'Lambchop',
      slug: 'lambchop',
    },
    currentRun: {
      run_id: 'run-active-build',
      active_work_item: 'story-build',
      started_at: '2026-06-18T16:00:00Z',
      status: 'running',
      owner: 'codex-cli',
    },
    stories: [
      {
        key: 'story-plan',
        title: 'Plan the next production floor improvement',
        floorState: 'office',
        activeMissionKey: 'mission-plan',
        acceptedOutcomes: [],
      },
      {
        key: 'story-build',
        title: 'Build the readable board',
        floorState: 'workshop',
        activeMissionKey: 'mission-build',
        acceptedOutcomes: [],
      },
      {
        key: 'story-review',
        title: 'Return failed integration to course correction',
        floorState: 'handoff-to-office',
        activeMissionKey: 'mission-review',
        acceptedOutcomes: [],
      },
      {
        key: 'story-blocked',
        title: 'Resolve dashboard blocker',
        floorState: 'blocked',
        activeMissionKey: 'mission-repair',
        acceptedOutcomes: [],
      },
    ],
    missions: [
      { key: 'mission-plan', storyKey: 'story-plan', type: 'brief', status: 'active' },
      { key: 'mission-build', storyKey: 'story-build', type: 'implement', status: 'active' },
      { key: 'mission-review', storyKey: 'story-review', type: 'validate', status: 'active' },
      { key: 'mission-repair', storyKey: 'story-blocked', type: 'repair', status: 'active' },
    ],
    evidence: [
      { type: 'validation_failed', storyKey: 'story-review', at: '2026-06-18T16:10:00Z', summary: 'Integration check failed.' },
      { type: 'human_blocked', storyKey: 'story-blocked', at: '2026-06-18T16:15:00Z', summary: 'Waiting on Bill decision.' },
    ],
  });

  assert.deepEqual(
    projection.stories.map((story) => ({
      key: story.key,
      visualState: story.visualState,
      assignedAgents: story.assignedAgents,
      currentRun: story.currentRun,
      evidenceSummary: story.evidenceSummary,
    })),
    [
      {
        key: 'story-plan',
        visualState: 'planning',
        assignedAgents: ['Strategist', 'Steward'],
        currentRun: null,
        evidenceSummary: 'No evidence yet.',
      },
      {
        key: 'story-build',
        visualState: 'building',
        assignedAgents: ['Builder', 'Steward'],
        currentRun: {
          runId: 'run-active-build',
          owner: 'codex-cli',
          startedAt: '2026-06-18T16:00:00Z',
          status: 'running',
        },
        evidenceSummary: 'No evidence yet.',
      },
      {
        key: 'story-review',
        visualState: 'handoff',
        assignedAgents: ['Verifier', 'Strategist', 'Steward'],
        currentRun: null,
        evidenceSummary: 'Integration check failed.',
      },
      {
        key: 'story-blocked',
        visualState: 'blocked',
        assignedAgents: ['Scout', 'Steward'],
        currentRun: null,
        evidenceSummary: 'Waiting on Bill decision.',
      },
    ],
  );
});
