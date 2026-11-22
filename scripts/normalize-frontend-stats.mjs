/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
import { copyFileSync, existsSync } from 'node:fs'

const currentStats = 'dist/frontend/browser-stats.json'
const legacyStats = 'dist/frontend/stats.json'
if (existsSync(currentStats)) copyFileSync(currentStats, legacyStats)
if (!existsSync(legacyStats)) throw new Error('Angular did not generate build statistics')
