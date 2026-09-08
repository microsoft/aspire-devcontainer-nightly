import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const script = resolve('.github/scripts/prepare-config.mjs');
const source = resolve('.devcontainer/devcontainer.json');

for (const withoutDotnet of [false, true]) {
  test(`relocates the ${withoutDotnet ? 'SDK-free' : 'standard'} configuration`, t => {
    const directory = mkdtempSync(join(tmpdir(), 'aspire-nightly-config-'));
    t.after(() => rmSync(directory, { recursive: true }));
    const original = readFileSync(source, 'utf8');
    const output = join(directory, 'nested', 'devcontainer.json');
    execFileSync(process.execPath, [
      script, '--output', output, ...(withoutDotnet ? ['--without-dotnet'] : []),
    ]);

    const expected = JSON.parse(original);
    expected.build.dockerfile = resolve('.devcontainer/Dockerfile');
    expected.build.context = resolve('.devcontainer');
    if (withoutDotnet) {
      delete expected.features['ghcr.io/devcontainers/features/dotnet:2'];
    }
    const actual = JSON.parse(readFileSync(output, 'utf8'));
    assert.deepEqual(actual, expected);
    assert.ok(actual.remoteEnv.PATH.split(':').includes('/home/vscode/.dotnet/tools'),
      'Global .NET tools must remain on the remote PATH.');
    assert.ok(existsSync(actual.build.dockerfile));
    assert.ok(existsSync(actual.build.context));
    assert.equal(readFileSync(source, 'utf8'), original);
  });
}

test('rejects overwriting the source configuration', () => {
  const original = readFileSync(source, 'utf8');
  const result = spawnSync(process.execPath, [script, '--output', source], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Use a separate output path/);
  assert.equal(readFileSync(source, 'utf8'), original);
});

test('requires a supported output filename', t => {
  const directory = mkdtempSync(join(tmpdir(), 'aspire-nightly-config-'));
  t.after(() => rmSync(directory, { recursive: true }));
  const output = join(directory, 'invalid.json');
  const result = spawnSync(process.execPath, [script, '--output', output], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must be named devcontainer.json or .devcontainer.json/);
  assert.equal(existsSync(output), false);
});

test('requires an output path', () => {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--output is required/);
});
