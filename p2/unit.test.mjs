import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { test } from 'node:test'

test('suíte unitária P2 no código real do Juice Shop', () => {
  const result = spawnSync(process.execPath, ['--import', './test/server/helpers/test-env.mjs', '--import', 'tsx', '--test', '--test-force-exit', 'test/server/p2Date.unit.test.ts', 'test/server/p2Utils.unit.test.ts'], { cwd: '..', encoding: 'utf8' })
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  assert.equal(result.status, 0)
})
