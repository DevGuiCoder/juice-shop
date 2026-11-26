/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { it } from 'node:test'
import assert from 'node:assert/strict'
import { toMMMYY, trunc, unquote, extractFilename, diceCoefficient } from '../../lib/utils'

void it('P2 U-07 formats month and two-digit year', () => {
  assert.equal(toMMMYY(new Date(2026, 10, 26)), 'NOV26')
})
void it('P2 U-08 truncates text longer than the limit with ellipsis', () => {
  assert.equal(trunc('Juice Shop', 5), 'Juic...')
})
void it('P2 U-09 keeps text whose length equals the limit', () => {
  assert.equal(trunc('Juice', 5), 'Juice')
})
void it('P2 U-10 removes surrounding double quotes only', () => {
  assert.equal(unquote('"apple"'), 'apple')
  assert.equal(unquote('"apple'), '"apple')
})
void it('P2 U-11 extracts a decoded file name without query string', () => {
  assert.equal(extractFilename('http://127.0.0.1:3000/ftp/legal%20file.md?x=1'), 'legal file.md')
})
void it('P2 U-12 computes dice coefficient for identical and disjoint strings', () => {
  assert.equal(diceCoefficient('apple', 'apple'), 1)
  assert.equal(diceCoefficient('ab', 'cd'), 0)
})
