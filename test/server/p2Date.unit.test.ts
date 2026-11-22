/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { it } from 'node:test'
import assert from 'node:assert/strict'
import { toISO8601 } from '../../lib/utils'

void it('P2 U-01 pads a single-digit month and day', () => {
  assert.equal(toISO8601(new Date(2026, 0, 5)), '2026-01-05')
})
void it('P2 U-02 preserves a leap day', () => {
  assert.equal(toISO8601(new Date(2024, 1, 29)), '2024-02-29')
})
void it('P2 U-03 formats the final day of a year', () => {
  assert.equal(toISO8601(new Date(2026, 11, 31)), '2026-12-31')
})
void it('P2 U-04 ignores the time when formatting a local date', () => {
  assert.equal(toISO8601(new Date(2026, 5, 15, 23, 59)), '2026-06-15')
})
void it('P2 U-05 preserves local calendar fields without converting to UTC', () => {
  assert.equal(toISO8601(new Date(2026, 10, 22, 0, 1)), '2026-11-22')
})
void it('P2 U-06 rejects an invalid date instead of returning NaN fields', () => {
  assert.throws(() => toISO8601(new Date(Number.NaN)), { name: 'RangeError', message: 'Invalid date' })
})
