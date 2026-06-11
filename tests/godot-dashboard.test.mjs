import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dashboardScript = readFileSync(
  join('C:', 'Users', 'BillMartin', 'plugins', 'lambchop-godot-dashboard', 'godot', 'scripts', 'dashboard.gd'),
  'utf8',
);

test('Godot dashboard exposes gamified monitoring HUD signals', () => {
  for (const expectedSignal of [
    'Scheduler Heartbeat',
    'Run Timeline',
    'Validation Lights',
    'Backoff Meter',
    'Trust Meter',
    'World Events',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedSignal), `dashboard should render ${expectedSignal}`);
  }
});

test('Godot dashboard trust HUD uses state-backed blockers', () => {
  for (const expectedText of [
    'state_path',
    'needs-triage',
    'ready-for-agent',
    'disabled_by_operator',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should surface ${expectedText}`);
  }
});

test('Godot dashboard does not invent green validation telemetry', () => {
  assert.doesNotMatch(dashboardScript, /Validation lights green/);
  assert.match(dashboardScript, /last_run\.get\("validation"/);
  assert.match(dashboardScript, /validation_note/);
  assert.match(dashboardScript, /_recent_validation_entries/);
});

test('Godot dashboard agent strip exposes operational presence', () => {
  assert.match(dashboardScript, /_agent_presence/);
  assert.match(dashboardScript, /current assignment/);
  assert.match(dashboardScript, /mood/);
});

test('Godot dashboard world events avoid unsupported telemetry claims', () => {
  assert.match(dashboardScript, /validation_state == "no validation evidence"/);
  assert.match(dashboardScript, /_has_label_trust_blocker/);
  assert.match(dashboardScript, /_refresh_operational_surfaces/);
});

test('Godot dashboard validation light color is data-derived', () => {
  assert.match(dashboardScript, /_validation_color/);
  assert.doesNotMatch(dashboardScript, /"Validation Lights", _validation_lights\(\), Color\("#10B981"\)/);
});

test('Godot dashboard verifier mood uses actual red validation evidence', () => {
  assert.match(dashboardScript, /_has_red_validation/);
  assert.doesNotMatch(dashboardScript, /validation_state\.findn\("red"\) >= 0/);
});

test('Godot dashboard renders a studio production floor skeleton instead of generic workflow buckets', () => {
  for (const expectedText of [
    'Upstairs Office',
    'Downstairs Workshop',
    'Stairwell Handoff',
    'Build Bay',
    'Asset Bench',
    'Integration Bay',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.doesNotMatch(dashboardScript, /const BUCKETS :=/);
  assert.match(dashboardScript, /_build_studio_scene/);
  assert.match(dashboardScript, /_build_isometric_floor_plate/);
  assert.match(dashboardScript, /_build_stair_connector/);
  assert.match(dashboardScript, /position = Vector2/);
});

test('Godot dashboard keeps both floors visible while allowing floor focus drill-in', () => {
  for (const expectedText of [
    'All Floors',
    'Focus Office',
    'Focus Workshop',
    'floor focus',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.match(dashboardScript, /var focused_floor := "all"/);
  assert.match(dashboardScript, /_set_floor_focus/);
  assert.match(dashboardScript, /_focus_tint/);
  assert.match(dashboardScript, /_focus_scale/);
});

test('Godot dashboard keeps story identity as a card while anchoring a physical job object at the station', () => {
  for (const expectedText of [
    'Story Anchor',
    'Job Object',
    'station marker',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.match(dashboardScript, /_build_story_station_cluster/);
  assert.match(dashboardScript, /_build_job_object/);
  assert.match(dashboardScript, /_story_station_label/);
  assert.doesNotMatch(dashboardScript, /drag_data/);
});

test('Godot dashboard represents office-to-workshop transfer as a station handoff across floors', () => {
  for (const expectedText of [
    'handoff route',
    'Office -> Workshop',
    'planning station',
    'build station',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.match(dashboardScript, /_handoff_route_text/);
  assert.match(dashboardScript, /_story_station_mode/);
  assert.match(dashboardScript, /handoff-to-workshop/);
  assert.doesNotMatch(dashboardScript, /drag preview/);
});

test('Godot dashboard attaches crew and blocker posture to story cards', () => {
  for (const expectedText of [
    'Crew on Story',
    'blocked posture',
    'handoff-to-workshop',
    'handoff-to-office',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.match(dashboardScript, /_story_assigned_agents/);
  assert.match(dashboardScript, /_story_posture/);
});
