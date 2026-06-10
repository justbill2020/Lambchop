import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function readRepoFile(...parts) {
  return readFileSync(join(repoRoot, ...parts), 'utf8');
}

test('workflow contract requires TDD skill behavior for Lambchop and target projects', () => {
  const currentWorkflow = readRepoFile('WORKFLOW.md');
  const templateWorkflow = readRepoFile('autonomous-coding-team', 'assets', 'templates', 'WORKFLOW.md');
  const automationPrompt = readRepoFile('autonomous-coding-team', 'references', 'automation-prompt.md');

  for (const [name, content] of [
    ['current workflow', currentWorkflow],
    ['template workflow', templateWorkflow],
    ['automation prompt', automationPrompt],
  ]) {
    assert.match(content, /`tdd` skill|tdd skill/i, `${name} must explicitly require the tdd skill`);
    assert.match(content, /one public-behavior test first/i, `${name} must describe public-behavior test-first work`);
    assert.match(content, /minimal implementation/i, `${name} must describe minimal implementation after RED`);
    assert.match(content, /refactor while green/i, `${name} must prevent refactoring while RED`);
  }
});

test('workflow contract enforces a two-phase plan/schedule vs execute loop', () => {
  const currentWorkflow = readRepoFile('WORKFLOW.md');
  const templateWorkflow = readRepoFile('autonomous-coding-team', 'assets', 'templates', 'WORKFLOW.md');
  const automationPrompt = readRepoFile('autonomous-coding-team', 'references', 'automation-prompt.md');

  for (const [name, content] of [
    ['current workflow', currentWorkflow],
    ['template workflow', templateWorkflow],
    ['automation prompt', automationPrompt],
  ]) {
    assert.match(content, /two-phase loop|two[- ]phase/i, `${name} must describe the two-phase loop`);
    assert.match(
      content,
      /do not implement newly created tasks|do not implement newly-created tasks/i,
      `${name} must forbid same-turn plan-and-execute for newly created tasks`,
    );
  }
});

test('workflow contract requires explicit operator questions for decisions', () => {
  const currentWorkflow = readRepoFile('WORKFLOW.md');
  const templateWorkflow = readRepoFile('autonomous-coding-team', 'assets', 'templates', 'WORKFLOW.md');
  const automationPrompt = readRepoFile('autonomous-coding-team', 'references', 'automation-prompt.md');

  for (const [name, content] of [
    ['current workflow', currentWorkflow],
    ['template workflow', templateWorkflow],
    ['automation prompt', automationPrompt],
  ]) {
    assert.match(
      content,
      /ask (bill|the operator) explicitly|Operator Decisions \(Ask First\)/i,
      `${name} must require asking explicit questions when decisions are needed`,
    );
    assert.match(
      content,
      /self-contained|recommended default|alternatives/i,
      `${name} must require self-contained decision questions with options`,
    );
  }
});

test('workflow contract defines maintenance override via chat_policy mode', () => {
  const currentWorkflow = readRepoFile('WORKFLOW.md');
  const templateWorkflow = readRepoFile('autonomous-coding-team', 'assets', 'templates', 'WORKFLOW.md');

  for (const [name, content] of [
    ['current workflow', currentWorkflow],
    ['template workflow', templateWorkflow],
  ]) {
    assert.match(content, /chat_policy/i, `${name} must reference chat_policy for explicit overrides`);
    assert.match(content, /maintenance/i, `${name} must define maintenance mode semantics`);
  }
});

test('workflow contract defaults GitHub repositories to GitHub Issues triage', () => {
  const currentWorkflow = readRepoFile('WORKFLOW.md');
  const templateWorkflow = readRepoFile('autonomous-coding-team', 'assets', 'templates', 'WORKFLOW.md');
  const state = JSON.parse(readRepoFile('docs', 'lambchop', 'state.json'));
  const templateState = JSON.parse(readRepoFile('autonomous-coding-team', 'assets', 'templates', 'state.json'));
  const agentInstructions = readRepoFile('AGENTS.md');
  const issueTrackerDocs = readRepoFile('docs', 'agents', 'issue-tracker.md');
  const domainDocs = readRepoFile('docs', 'agents', 'domain.md');

  for (const [name, content] of [
    ['current workflow', currentWorkflow],
    ['template workflow', templateWorkflow],
    ['agent instructions', agentInstructions],
    ['issue tracker docs', issueTrackerDocs],
  ]) {
    assert.match(content, /GitHub Issues/i, `${name} must name GitHub Issues as the default tracker`);
    assert.match(content, /gh issue/i, `${name} must document gh issue usage`);
  }

  for (const [name, project] of [
    ['current state', state.project],
    ['template state', templateState.project],
  ]) {
    assert.equal(project.external_issue_tracking, true, `${name} must enable external issue tracking`);
    assert.equal(project.issue_tracker.type, 'github', `${name} must use GitHub as the issue tracker`);
    assert.equal(project.issue_tracker.cli, 'gh', `${name} must use gh for issue operations`);
  }

  assert.match(domainDocs, /recursive|self-host/i, 'domain docs must note Lambchop self-hosting recursion');
});

test('workflow contract requires source-of-truth completion on the integration branch', () => {
  const currentWorkflow = readRepoFile('WORKFLOW.md');
  const templateWorkflow = readRepoFile('autonomous-coding-team', 'assets', 'templates', 'WORKFLOW.md');
  const automationPrompt = readRepoFile('autonomous-coding-team', 'references', 'automation-prompt.md');

  for (const [name, content] of [
    ['current workflow', currentWorkflow],
    ['template workflow', templateWorkflow],
    ['automation prompt', automationPrompt],
  ]) {
    assert.match(content, /source-of-truth|source of truth/i, `${name} must define a source-of-truth completion gate`);
    assert.match(content, /integration branch|main branch|canonical state/i, `${name} must require canonical branch reconciliation`);
    assert.match(content, /side-branch|branch-only|ledger-only|memory-only/i, `${name} must reject branch-only or ledger-only completion`);
  }
});

test('workflow contract uses one execution model instead of chat intake-only mode', () => {
  const currentWorkflow = readRepoFile('WORKFLOW.md');
  const templateWorkflow = readRepoFile('autonomous-coding-team', 'assets', 'templates', 'WORKFLOW.md');
  const automationSkill = readRepoFile('autonomous-coding-team', 'SKILL.md');
  const architectureNotes = readRepoFile('autonomous-coding-team', 'references', 'workflow-architecture.md');

  for (const [name, content] of [
    ['current workflow', currentWorkflow],
    ['template workflow', templateWorkflow],
    ['skill', automationSkill],
    ['workflow architecture', architectureNotes],
  ]) {
    assert.doesNotMatch(content, /intake-only|intake\/planning-only|must act as an intake agent/i, `${name} must not preserve intake-only execution rules`);
    assert.match(content, /diagnose|bounded direct work|implement directly when safe|single execution model/i, `${name} must describe direct execution for bounded work`);
  }
});
