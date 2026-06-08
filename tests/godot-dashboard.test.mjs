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
