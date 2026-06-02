import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const repoRoot = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const templateRoot = join(repoRoot, 'autonomous-coding-team', 'assets', 'templates', '.codex');
const hooksJsonPath = join(templateRoot, 'hooks.json');
const hookScripts = [
  'lambchop_session_start.py',
  'lambchop_user_prompt_submit.py',
  'lambchop_pre_tool_use.py',
  'lambchop_post_tool_use.py',
  'lambchop_stop.py',
];

function runPython(scriptPath, input) {
  const result = spawnSync('python', [scriptPath], {
    input: JSON.stringify(input),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim() ? JSON.parse(result.stdout) : {};
}

test('hook template config includes all Lambchop lifecycle hooks with git-root commands', () => {
  const hooksConfig = JSON.parse(readFileSync(hooksJsonPath, 'utf8'));
  const hooks = hooksConfig.hooks;
  assert.ok(hooks.SessionStart, 'SessionStart hook missing');
  assert.ok(hooks.UserPromptSubmit, 'UserPromptSubmit hook missing');
  assert.ok(hooks.PreToolUse, 'PreToolUse hook missing');
  assert.ok(hooks.PostToolUse, 'PostToolUse hook missing');
  assert.ok(hooks.Stop, 'Stop hook missing');

  const commands = JSON.stringify(hooksConfig);
  for (const script of hookScripts) {
    assert.ok(commands.includes(script), `${script} missing from hooks.json`);
  }
  assert.match(commands, /git rev-parse --show-toplevel/);
  assert.match(commands, /lambchop_/);
});

test('all Lambchop hook scripts exist in the template', () => {
  for (const script of hookScripts) {
    assert.ok(existsSync(join(templateRoot, 'hooks', script)), `${script} missing`);
  }
});

test('PreToolUse blocks forbidden local-automation actions but allows ordinary reads', () => {
  const scriptPath = join(templateRoot, 'hooks', 'lambchop_pre_tool_use.py');
  const blocked = runPython(scriptPath, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'git reset --hard HEAD' },
  });
  assert.equal(blocked.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(blocked.hookSpecificOutput.permissionDecisionReason, /destructive git/i);

  const allowed = runPython(scriptPath, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'git status --short' },
  });
  assert.notEqual(allowed.hookSpecificOutput?.permissionDecision, 'deny');
});

test('prompt and session hooks add Lambchop operating context', () => {
  const session = runPython(join(templateRoot, 'hooks', 'lambchop_session_start.py'), {
    hook_event_name: 'SessionStart',
    source: 'startup',
  });
  assert.match(session.hookSpecificOutput.additionalContext, /WORKFLOW\.md/);
  assert.match(session.hookSpecificOutput.additionalContext, /repo-local hooks/i);
  assert.match(session.hookSpecificOutput.additionalContext, /Huashu Design/i);
  assert.match(session.hookSpecificOutput.additionalContext, /Lambchop source/i);

  const prompt = runPython(join(templateRoot, 'hooks', 'lambchop_user_prompt_submit.py'), {
    hook_event_name: 'UserPromptSubmit',
    prompt: 'This feature is broken, please fix it',
  });
  assert.match(prompt.hookSpecificOutput.additionalContext, /intake/i);
  assert.match(prompt.hookSpecificOutput.additionalContext, /queue/i);
  assert.match(prompt.hookSpecificOutput.additionalContext, /do not implement/i);
  assert.match(prompt.hookSpecificOutput.additionalContext, /unpause/i);
  assert.match(prompt.hookSpecificOutput.additionalContext, /trigger/i);

  const design = runPython(join(templateRoot, 'hooks', 'lambchop_user_prompt_submit.py'), {
    prompt: 'Please improve the dashboard GUI layout and visual polish.',
  });
  assert.match(design.hookSpecificOutput.additionalContext, /Huashu Design/i);
  assert.match(design.hookSpecificOutput.additionalContext, /before changing/i);
});

test('PostToolUse and Stop hooks request evidence when workflow quality is at risk', () => {
  const post = runPython(join(templateRoot, 'hooks', 'lambchop_post_tool_use.py'), {
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'npm test' },
    tool_response: { exit_code: 1, stderr: 'failing tests' },
  });
  assert.match(post.hookSpecificOutput.additionalContext, /validation/i);
  assert.match(post.hookSpecificOutput.additionalContext, /progress/i);

  const stop = runPython(join(templateRoot, 'hooks', 'lambchop_stop.py'), {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    last_assistant_message: 'Done.',
  });
  assert.equal(stop.decision, 'block');
  assert.match(stop.reason, /ledger|validation|dashboard/i);
});

test('Stop hook blocks feature-chat endings that skip automation handoff', () => {
  const scriptPath = join(templateRoot, 'hooks', 'lambchop_stop.py');
  const queuedOnly = runPython(scriptPath, {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    last_assistant_message: 'Queued TASK-123 for the automation.',
  });
  assert.equal(queuedOnly.decision, 'block');
  assert.match(queuedOnly.reason, /trigger/i);

  const twoPhaseSummaryOnly = runPython(scriptPath, {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    last_assistant_message: 'Two-phase loop: planning/scheduling only. Updated state.json and progress.md with notes.',
  });
  assert.equal(twoPhaseSummaryOnly.decision, 'block');
  assert.match(twoPhaseSummaryOnly.reason, /queue/i);

  const queuedAndImplementedSameTask = runPython(scriptPath, {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    last_assistant_message: (
      'Queued task-123, implemented task-123, unpaused the automation, triggered scheduler-visible run-now, '
      + 'and recorded progress/dashboard evidence.'
    ),
  });
  assert.equal(queuedAndImplementedSameTask.decision, 'block');
  assert.match(queuedAndImplementedSameTask.reason, /two-phase|schedule|queue/i);

  const implementedInChat = runPython(scriptPath, {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    last_assistant_message: 'Implemented the requested feature and updated the tests.',
  });
  assert.equal(implementedInChat.decision, 'block');
  assert.match(implementedInChat.reason, /intake|automation/i);

  const handedOff = runPython(scriptPath, {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    last_assistant_message: 'Queued TASK-123, recorded progress/dashboard evidence, confirmed the automation was already active, and triggered scheduler-visible run-now.',
  });
  assert.equal(handedOff.continue, true);

  const handoffThenMoreWork = runPython(scriptPath, {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    last_assistant_message: 'Queued TASK-123, unpaused the automation, triggered scheduler-visible run-now, and then updated progress.md and dashboard evidence.',
  });
  assert.equal(handoffThenMoreWork.decision, 'block');
  assert.match(handoffThenMoreWork.reason, /terminal/i);
});

test('Stop hook requires commit and push evidence for GitHub repos when publishing is enabled', () => {
  const scriptPath = join(templateRoot, 'hooks', 'lambchop_stop.py');
  const missingPublishEvidence = runPython(scriptPath, {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    github_repo: true,
    workflow_allows_push: true,
    last_assistant_message: 'Validated tests, updated progress.md, dashboard, and backoff evidence.',
  });
  assert.equal(missingPublishEvidence.decision, 'block');
  assert.match(missingPublishEvidence.reason, /commit/i);
  assert.match(missingPublishEvidence.reason, /push/i);

  const published = runPython(scriptPath, {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    github_repo: true,
    workflow_allows_push: true,
    last_assistant_message: 'Validated tests, committed the changes, pushed the branch to GitHub, and updated progress.md/dashboard/backoff evidence.',
  });
  assert.equal(published.continue, true);
});

test('Stop hook blocks branch-only completion claims until the integration branch is updated', () => {
  const scriptPath = join(templateRoot, 'hooks', 'lambchop_stop.py');
  const branchOnly = runPython(scriptPath, {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    git_branch: 'codex/lambchop-task-22-control-loop-real-work-gate',
    integration_branch: 'main',
    last_assistant_message: (
      'Completed task-22, validated tests, committed the fix, and updated progress.md/dashboard/backoff evidence.'
    ),
  });
  assert.equal(branchOnly.decision, 'block');
  assert.match(branchOnly.reason, /integration branch|source-of-truth|main/i);

  const integrated = runPython(scriptPath, {
    hook_event_name: 'Stop',
    stop_hook_active: false,
    git_branch: 'main',
    integration_branch: 'main',
    last_assistant_message: (
      'Completed task-22 on the integration branch, validated tests, committed the fix, and updated progress.md/dashboard/backoff evidence.'
    ),
  });
  assert.equal(integrated.continue, true);
});

test('Stop hook allows maintenance mode override from state chat_policy', () => {
  const statePath = join(repoRoot, 'docs', 'lambchop', 'state.json');
  const original = readFileSync(statePath, 'utf8');
  try {
    const state = JSON.parse(original);
    state.project.chat_policy = {
      mode: 'maintenance',
      modes: ['intake', 'maintenance'],
      notes: 'test override',
    };
    writeFileSync(statePath, JSON.stringify(state, null, 2));

    const scriptPath = join(templateRoot, 'hooks', 'lambchop_stop.py');
    const maintenance = runPython(scriptPath, {
      hook_event_name: 'Stop',
      stop_hook_active: false,
      last_assistant_message: 'Implemented the requested feature and updated the tests.',
    });
    assert.equal(maintenance.continue, true);
  } finally {
    writeFileSync(statePath, original);
  }
});

test('repo hook installer preserves unrelated hooks and replaces stale Lambchop hooks', () => {
  const targetRoot = mkdtempSync(join(tmpdir(), 'lambchop-hooks-'));
  mkdirSync(join(targetRoot, '.codex', 'hooks'), { recursive: true });
  writeFileSync(join(targetRoot, '.codex', 'hooks.json'), JSON.stringify({
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            { type: 'command', command: 'python keep_me.py' },
            { type: 'command', command: 'python old_lambchop_pre_tool_use.py' },
          ],
        },
      ],
    },
  }, null, 2));

  const result = spawnSync('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    join(repoRoot, 'autonomous-coding-team', 'tools', 'install-repo-hooks.ps1'),
    '-TargetRoot',
    targetRoot,
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const merged = JSON.parse(readFileSync(join(targetRoot, '.codex', 'hooks.json'), 'utf8'));
  const mergedCommands = JSON.stringify(merged);
  assert.match(mergedCommands, /python keep_me\.py/);
  assert.doesNotMatch(mergedCommands, /old_lambchop_pre_tool_use/);
  for (const script of hookScripts) {
    assert.ok(existsSync(join(targetRoot, '.codex', 'hooks', script)), `${script} was not copied`);
    assert.match(mergedCommands, new RegExp(script.replace('.', '\\.')));
  }
});

test('repo hook installer creates hooks in a repo with no existing hooks file', () => {
  const targetRoot = mkdtempSync(join(tmpdir(), 'lambchop-hooks-empty-'));
  const result = spawnSync('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    join(repoRoot, 'autonomous-coding-team', 'tools', 'install-repo-hooks.ps1'),
    '-TargetRoot',
    targetRoot,
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const merged = JSON.parse(readFileSync(join(targetRoot, '.codex', 'hooks.json'), 'utf8'));
  assert.ok(merged.hooks.SessionStart);
  assert.ok(merged.hooks.UserPromptSubmit);
  assert.ok(merged.hooks.PreToolUse);
  assert.ok(merged.hooks.PostToolUse);
  assert.ok(merged.hooks.Stop);
});

test('repo hook installer blocks malformed existing hook JSON without overwriting it', () => {
  const targetRoot = mkdtempSync(join(tmpdir(), 'lambchop-hooks-malformed-'));
  mkdirSync(join(targetRoot, '.codex'), { recursive: true });
  const hooksPath = join(targetRoot, '.codex', 'hooks.json');
  writeFileSync(hooksPath, '{not-json');

  const result = spawnSync('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    join(repoRoot, 'autonomous-coding-team', 'tools', 'install-repo-hooks.ps1'),
    '-TargetRoot',
    targetRoot,
  ], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /Cannot parse existing hooks file/);
  assert.equal(readFileSync(hooksPath, 'utf8'), '{not-json');
});
