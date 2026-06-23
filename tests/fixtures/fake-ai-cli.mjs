#!/usr/bin/env node

const [, , adapter, ...args] = process.argv;
const prompt = args.at(-1) ?? '';

process.stdout.write(`FAKE_AI_ADAPTER:${adapter}\n`);
process.stdout.write(`FAKE_AI_ARGS:${JSON.stringify(args.slice(0, -1))}\n`);
process.stdout.write(`FAKE_AI_PROMPT:${prompt}\n`);

if (args.includes('--fail')) {
  process.stderr.write('FAKE_AI_FAIL\n');
  process.exit(17);
}

process.stdout.write('CHANGED_FILES:["ADAPTER_RESULT.md"]\n');
process.exit(0);
