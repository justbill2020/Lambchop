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
