#!/usr/bin/env node

process.stdout.write('FAKE_CODEX_START\n');
process.stdout.write(`FAKE_CODEX_ARGS:${JSON.stringify(process.argv.slice(2))}\n`);

setTimeout(() => {
  process.stdout.write('FAKE_CODEX_DONE\n');
  process.exit(0);
}, 10);
