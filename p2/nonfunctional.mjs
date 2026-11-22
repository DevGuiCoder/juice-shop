import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { baseUrl } from './local-only.mjs'

const results = []
async function measure (id, path, count, options, verify) {
  const samples = []
  try {
    for (let i = 0; i < count + (id === 'NF-01' || id === 'NF-02' ? 3 : 0); i++) {
      const start = performance.now()
      const response = await fetch(baseUrl + path, { ...options, signal: AbortSignal.timeout(10000) })
      const body = await response.text()
      const sample = { milliseconds: performance.now() - start, status: response.status, body }
      verify(sample, samples)
      if (i >= (id === 'NF-01' || id === 'NF-02' ? 3 : 0)) samples.push(sample)
    }
    const times = samples.map(s => s.milliseconds).sort((a, b) => a - b)
    const p95 = times[Math.ceil(times.length * 0.95) - 1]
    if (id === 'NF-01' || id === 'NF-02') assert.ok(p95 <= 2000, `p95 ${p95} > 2000 ms`)
    results.push({ id, status: 'Aprovado', samples, p95 })
  } catch (error) {
    results.push({ id, status: samples.length ? 'Reprovado' : 'Bloqueado', samples, error: error.message })
  }
}
await measure('NF-01', '/api/Products', 20, {}, s => { assert.equal(s.status, 200); assert.ok(Array.isArray(JSON.parse(s.body).data)) })
await measure('NF-02', '/rest/products/search?q=Apple', 20, {}, s => { assert.equal(s.status, 200); assert.ok(JSON.parse(s.body).data.length > 0) })
await measure('NF-05', '/rest/products/search?q=Apple', 10, {}, (s, previous) => {
  assert.equal(s.status, 200)
  if (previous.length) assert.deepEqual(JSON.parse(s.body).data.map(p => p.id), JSON.parse(previous[0].body).data.map(p => p.id))
})
await measure('NF-06', '/rest/user/login', 10, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'inexistente.p2@example.test', password: 'Errada123!' }) }, s => { assert.equal(s.status, 401); assert.ok(!s.body.includes('"token"')) })
await mkdir('evidence', { recursive: true })
await writeFile('evidence/nonfunctional.json', JSON.stringify({ recordedAt: new Date().toISOString(), environment: { baseUrl, node: process.version, platform: process.platform }, results }, null, 2))
console.log(results.map(({ id, status, p95, error }) => ({ id, status, p95, error })))
if (results.some(r => r.status !== 'Aprovado')) process.exitCode = 1
