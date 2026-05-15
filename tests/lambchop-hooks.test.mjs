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

  const prompt = runPython(join(templateRoot, 'hooks', 'lambchop_user_prompt_submit.py'), {
    hook_event_name: 'UserPromptSubmit',
    prompt: 'This feature is broken, please fix it',
  });
  assert.match(prompt.hookSpecificOutput.additionalContext, /intake/i);
  assert.match(prompt.hookSpecificOutput.additionalContext, /queue/i);
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
