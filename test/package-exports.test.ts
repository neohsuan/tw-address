import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageName = '@hsuan741220/tw-address';
const expectedExports = ['format', 'listCounties', 'listDistricts', 'lookupDistrict', 'lookupZip3', 'normalize', 'parse'];

interface Evaluation { names: string[]; zip: string; valid: boolean; version: string }

async function evaluate(mode: 'module' | 'commonjs'): Promise<Evaluation> {
  const temporary = mkdtempSync(join(tmpdir(), 'tw-address-exports-'));
  const output = join(temporary, 'result.json');
  const load = mode === 'module' ? `import * as api from '${packageName}'; import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);` : `const api = require('${packageName}');`;
  const script = `${load}
    const manifest = require('${packageName}/package.json');
    require('node:fs').writeFileSync(process.argv[1], JSON.stringify({ names: Object.keys(api).sort(), zip: api.lookupZip3('台北市', '大安區'),
      valid: api.parse('106臺北市大安區金山南路二段55號').valid, version: manifest.version }));`;
  try {
    await promisify(execFile)(process.execPath, [`--input-type=${mode}`, '-e', script, output], {
      cwd: new URL('..', import.meta.url), encoding: 'utf8',
    });
    return JSON.parse(readFileSync(output, 'utf8')) as Evaluation;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

describe('built package self-reference exports', () => {
  it('supports native require and native import with identical named exports', async () => {
    const esm = await evaluate('module');
    const cjs = await evaluate('commonjs');
    expect(esm).toEqual(cjs);
    expect(esm).toEqual({ names: expectedExports, zip: '106', valid: true, version: '1.0.0' });
  });
});
