import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dashboardScript = readFileSync(
  join('C:', 'Users', 'BillMartin', 'plugins', 'lambchop-godot-dashboard', 'godot', 'scripts', 'dashboard.gd'),
  'utf8',
);
const floorMapScriptPath = join('C:', 'Users', 'BillMartin', 'plugins', 'lambchop-godot-dashboard', 'godot', 'visual_orchestrator', 'ProductionFloorMap.gd');
const floorMapScenePath = join('C:', 'Users', 'BillMartin', 'plugins', 'lambchop-godot-dashboard', 'godot', 'visual_orchestrator', 'ProductionFloorMap.tscn');
const floorPlanJsonPath = join('C:', 'Users', 'BillMartin', 'plugins', 'lambchop-godot-dashboard', 'godot', 'visual_orchestrator', 'floorplans', 'visual_orchestrator_floorplans.json');
const floorPlanPngPath = join('C:', 'Users', 'BillMartin', 'plugins', 'lambchop-godot-dashboard', 'godot', 'visual_orchestrator', 'floorplans', 'visual_orchestrator_floorplans.png');

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
  assert.match(dashboardScript, /_is_floor_visible/);
  assert.match(dashboardScript, /_focus_scene_position/);
  assert.match(dashboardScript, /_focus_scene_size/);
  assert.match(dashboardScript, /_focus_tint/);
  assert.match(dashboardScript, /_focus_scale/);
  assert.match(dashboardScript, /_build_board_hud_overlay/);
  assert.match(dashboardScript, /hud_shell\.add_child\(_build_floor_toolbar\(\)\)/);
});

test('Godot dashboard keeps the studio scene inside a scrollable viewport instead of spilling off screen', () => {
  for (const expectedText of [
    'ScrollContainer',
    'clip_contents',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.match(dashboardScript, /var scene_scroll: ScrollContainer/);
  assert.match(dashboardScript, /var scene_stage: Control/);
  assert.match(dashboardScript, /_build_scene_stage/);
  assert.match(dashboardScript, /_mount_studio_scene/);
});

test('Godot dashboard keeps floor controls outside the physical floor hit area', () => {
  assert.doesNotMatch(dashboardScript, /controls\.position = Vector2\(24, 12\)/);
  assert.match(dashboardScript, /return Vector2\(278, 84\) if floor_key == "office" else Vector2\(44, 390\)/);
  assert.match(dashboardScript, /return Vector2\(900, 930\)/);
});

test('Godot dashboard supports zooming the production floor without moving the toolbar', () => {
  for (const expectedText of [
    'Zoom -',
    'Zoom +',
    'Reset Zoom',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.match(dashboardScript, /var floor_zoom := 1.0/);
  assert.match(dashboardScript, /_set_floor_zoom/);
  assert.match(dashboardScript, /_build_floor_toolbar/);
  assert.match(dashboardScript, /scene\.scale = Vector2\.ONE \* floor_zoom/);
});

test('Godot dashboard collapses the right detail rail until selection or explicit toggle opens it', () => {
  for (const expectedText of [
    'Show Crew Log',
    'Hide Crew Log',
    'Crew Log',
    'Operator next action',
    'Next useful action',
    'Human-facing blocker',
    'Proof / accepted outcomes',
    'Mission:',
    'Station:',
    'Validation:',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.match(dashboardScript, /var detail_panel: PanelContainer/);
  assert.match(dashboardScript, /var detail_open := false/);
  assert.match(dashboardScript, /_set_detail_open/);
  assert.match(dashboardScript, /_detail_panel_width/);
  assert.match(dashboardScript, /header\.add_child\(detail_toggle\)/);
  assert.match(dashboardScript, /detail_label\.custom_minimum_size = Vector2\(0, 520\)/);
  assert.match(dashboardScript, /detail_label\.size_flags_vertical = Control\.SIZE_EXPAND_FILL/);
});

test('Godot dashboard keeps story identity as a card while anchoring a physical job object at the station', () => {
  for (const expectedText of [
    'Story Anchor',
    'Job Object',
    'station marker',
    'projectFloor',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.match(dashboardScript, /_floor_stories/);
  assert.match(dashboardScript, /_story_station/);
  assert.match(dashboardScript, /_story_mission_type/);
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

test('Godot dashboard expresses blocked work mainly through nearby crew posture at stations', () => {
  for (const expectedText of [
    'Crew Presence',
    'nearby crew',
    'waiting-on-human',
    'waiting stance',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.match(dashboardScript, /_build_station_crew_presence/);
  assert.match(dashboardScript, /_crew_presence_for_item/);
  assert.match(dashboardScript, /_crew_posture_text/);
  assert.match(dashboardScript, /waiting-on-agent/);
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

test('Godot dashboard renders visible crew actors with motion on the floor', () => {
  for (const expectedText of [
    'crew-marker',
    'crew actor',
    'base_position',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText), `dashboard should render ${expectedText}`);
  }

  assert.match(dashboardScript, /var actor_layer: Control/);
  assert.match(dashboardScript, /var actor_clock := 0.0/);
  assert.match(dashboardScript, /func _process\(delta: float\)/);
  assert.match(dashboardScript, /_mount_crew_actors/);
  assert.match(dashboardScript, /_build_crew_actor/);
  assert.match(dashboardScript, /_crew_initials/);
  assert.match(dashboardScript, /_animate_crew_actors/);
});

test('Godot production floor map is data-driven from the supplied floor-plan package', () => {
  assert.ok(existsSync(floorMapScenePath), 'ProductionFloorMap scene should exist in the Godot plugin');
  assert.ok(existsSync(floorMapScriptPath), 'ProductionFloorMap script should exist in the Godot plugin');
  assert.ok(existsSync(floorPlanJsonPath), 'floor-plan JSON asset should be copied into the Godot plugin');
  assert.ok(existsSync(floorPlanPngPath), 'floor-plan PNG asset should be copied into the Godot plugin');

  const floorPlan = JSON.parse(readFileSync(floorPlanJsonPath, 'utf8'));
  assert.equal(floorPlan.schema, 'visual-orchestrator-floor-plan/v1');
  assert.deepEqual(floorPlan.style.viewport, { width: 1600, height: 1120 });
  const stations = floorPlan.floors.flatMap((floor) => floor.stations);
  assert.deepEqual(
    stations.map((station) => station.id),
    [
      'briefing-desk',
      'story-shaping-desk',
      'course-correction-desk',
      'build-bay',
      'asset-bench',
      'integration-bay',
      'blocked-bay',
    ],
  );
  assert.deepEqual(
    floorPlan.handoffs.map((handoff) => handoff.id),
    ['handoff-story-to-build', 'handoff-integration-to-correction'],
  );

  const floorMapScript = readFileSync(floorMapScriptPath, 'utf8');
  for (const expectedText of [
    'signal station_selected(station_id: String)',
    'signal handoff_selected(handoff_id: String)',
    'func load_floor_plan(json_path: String) -> void',
    'func set_station_state(station_id: String, state: String) -> void',
    'func set_handoff_state(handoff_id: String, state: String) -> void',
    'func focus_floor(floor_id: String) -> void',
    'func clear_runtime_states() -> void',
    'visual_orchestrator_floorplans.json',
    'visual_orchestrator_floorplans.png',
    '_map_point',
    '_map_rect',
    '_build_station_hitboxes',
    '_draw_handoff_routes',
  ]) {
    assert.match(floorMapScript, new RegExp(expectedText.replace(/[()]/g, '\\$&')));
  }

  assert.doesNotMatch(floorMapScript, /build-bay["']\s*:\s*Vector2/);
});

test('Godot dashboard mounts the production floor map scene as the physical orchestrator view', () => {
  assert.match(dashboardScript, /ProductionFloorMap\.tscn/);
  assert.match(dashboardScript, /_mount_production_floor_map/);
  assert.match(dashboardScript, /station_selected/);
  assert.match(dashboardScript, /handoff_selected/);
  assert.match(dashboardScript, /set_station_state/);
  assert.match(dashboardScript, /set_handoff_state/);
});

test('Godot production floor map renders a readable game board with job tokens and role-agent avatars', () => {
  const floorMapScript = readFileSync(floorMapScriptPath, 'utf8');

  for (const expectedText of [
    'JobToken',
    'AgentAvatar',
    'func _build_job_tokens',
    'func _build_agent_avatars',
    'func _station_anchor',
    'func _station_token_offset',
    'func _agent_avatar_offset',
    'func _agents_for_story',
    'func _job_token_color',
    'func _agent_role_color',
    'Planning Task',
    'Improvement Task',
    'Build Task',
    'Review Task',
    'Blocked Task',
  ]) {
    assert.match(floorMapScript, new RegExp(expectedText.replace(/[()]/g, '\\$&')));
  }

  assert.match(floorMapScript, /apply_project_floor\(project_floor: Dictionary\)/);
  assert.match(floorMapScript, /project_floor\.get\("stories"/);
  assert.match(floorMapScript, /story\.get\("placement"/);
  assert.match(floorMapScript, /anchor/);
  assert.doesNotMatch(floorMapScript, /Among Us|crewmate|impostor/i);
});

test('Godot production floor MVP supports animated handoffs, clickable pieces, occupancy counts, and inspector detail', () => {
  const floorMapScript = readFileSync(floorMapScriptPath, 'utf8');

  for (const expectedText of [
    'signal job_selected(story: Dictionary)',
    'signal agent_selected(agent: Dictionary)',
    'StationOccupancy',
    'RoutePulse',
    'handoff_progress',
    'route_points',
    'func _animate_board_pieces',
    'func _handoff_route_for_story',
    'func _handoff_progress',
    'func _build_station_occupancy_counts',
    'func _create_station_occupancy_badge',
    'func _piece_reason',
    'func _compact_story_title',
    'func _visual_state_for_story',
    'No evidence yet.',
  ]) {
    assert.match(floorMapScript, new RegExp(expectedText.replace(/[()]/g, '\\$&')));
  }

  assert.match(floorMapScript, /token\.pressed\.connect/);
  assert.match(floorMapScript, /job_selected\.emit\(story\)/);
  assert.match(floorMapScript, /avatar\.gui_input\.connect/);
  assert.match(floorMapScript, /agent_selected\.emit/);
  assert.match(floorMapScript, /set_process\(true\)/);
});

test('Godot production floor uses projected agent assignments and aggregates shared station state', () => {
  const floorMapScript = readFileSync(floorMapScriptPath, 'utf8');

  assert.match(floorMapScript, /story\.get\("assignedAgents", \[\]\)/);
  assert.match(floorMapScript, /not projected_agents\.is_empty\(\)/);
  assert.match(floorMapScript, /normalized\.append\(role\)/);
  assert.match(floorMapScript, /func _station_state_for_story\(story: Dictionary\) -> String/);
  assert.match(floorMapScript, /func _stronger_station_state\(current_state: String, candidate_state: String\) -> String/);
  assert.match(floorMapScript, /station_story_states\[station_id\] = _stronger_station_state/);
  assert.match(floorMapScript, /"blocked": 5/);
});

test('Godot dashboard mounts one production floor map after clearing old children', () => {
  const mountBody = dashboardScript.match(/func _mount_studio_scene\(\) -> void:\n(?<body>[\s\S]*?)\nfunc _mount_production_floor_map/)?.groups?.body ?? '';
  assert.match(mountBody, /for child in scene_stage\.get_children\(\):\s*child\.queue_free\(\)\s*_mount_production_floor_map\(\)/);
  assert.doesNotMatch(mountBody, /for child in scene_stage\.get_children\(\):\s*_mount_production_floor_map\(\)/);
});

test('Godot dashboard MVP has live refresh, true floor framing, legend, and richer inspector wiring', () => {
  for (const expectedText of [
    'refresh_timer',
    'selected_story_key',
    'selected_agent_key',
    'data_generated_at',
    'Dashboard data stale',
    'Task Legend',
    'Agent Roles',
    '_build_board_legend',
    '_restore_selection_after_refresh',
    '_show_floor_map_job_detail',
    '_show_floor_map_agent_detail',
    '_show_floor_map_handoff_detail',
    '_frame_floor_focus',
    'job_selected',
    'agent_selected',
    'evidenceSummary',
    'currentRun',
  ]) {
    assert.match(dashboardScript, new RegExp(expectedText.replace(/[()]/g, '\\$&')));
  }
});

test('Godot dashboard uses a board-first cockpit layout instead of a tall informational header', () => {
  assert.match(dashboardScript, /func _build_compact_command_bar\(\) -> Control/);
  assert.match(dashboardScript, /func _build_board_hud_overlay\(\) -> Control/);
  assert.match(dashboardScript, /func _build_collapsed_signal_drawers\(\) -> Control/);
  assert.match(dashboardScript, /BoardHudOverlay/);
  assert.match(dashboardScript, /Crew \/ Signals/);
  assert.match(dashboardScript, /scene_scroll\.custom_minimum_size = Vector2\(0, 860\)/);

  const buildUiBody = dashboardScript.match(/func _build_ui\(\) -> void:\n(?<body>[\s\S]*?)\nfunc _build_scene_stage/)?.groups?.body ?? '';
  const playfieldIndex = buildUiBody.indexOf('var playfield := HBoxContainer.new()');
  assert.ok(playfieldIndex >= 0, 'playfield should be built inside _build_ui');

  for (const bulkySurface of [
    'stack.add_child(agent_strip)',
    'stack.add_child(hud)',
    'stack.add_child(_build_floor_toolbar())',
    'stack.add_child(_build_board_legend())',
  ]) {
    const index = buildUiBody.indexOf(bulkySurface);
    assert.ok(index === -1 || index > playfieldIndex, `${bulkySurface} should not sit above the production floor`);
  }
});
