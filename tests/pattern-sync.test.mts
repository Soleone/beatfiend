import assert from 'node:assert/strict'
import test from 'node:test'
import { planPatternSync } from '../src/editor/pattern-sync.ts'
import type { BeatmapNote, Lane } from '../src/game/model.ts'

const note = (
  id: string,
  bar: number,
  withinBarMs: number,
  lane: Lane = 'kick',
  overrides: Partial<BeatmapNote> = {},
): BeatmapNote => ({
  id,
  impactTimeMs: bar * 2000 + withinBarMs,
  lane,
  strength: 1,
  source: 'test',
  ...overrides,
})

const plan = (notes: BeatmapNote[], selectedIds: string[]) => planPatternSync({
  notes,
  selectedNoteIds: new Set(selectedIds),
  bpm: 120,
  beatOffsetMs: 0,
  songEndMs: 12000,
})

test('copies the full selected pattern onto consecutive matching sections', () => {
  const notes = [
    note('source-a', 0, 250, 'kick', { rawTimeMs: 240, durationMs: 300, strength: 2 }),
    note('source-b', 1, 750, 'snare'),
    note('target-a', 2, 500, 'snare'),
    note('target-b', 3, 1000, 'kick', { durationMs: 100, strength: 2 }),
    note('next-a', 4, 1000, 'kick'),
    note('next-b', 5, 1250, 'snare'),
  ]

  const result = plan(notes, ['source-a', 'source-b'])
  assert.ok(result)
  assert.equal(result.synchronizedSections, 2)
  assert.deepEqual(result.updates.map((update) => ({
    id: update.id,
    impactTimeMs: update.impactTimeMs,
    rawTimeMs: update.rawTimeMs,
    durationMs: update.durationMs,
    lane: update.lane,
    strength: update.strength,
  })), [
    { id: 'target-a', impactTimeMs: 4250, rawTimeMs: 4240, durationMs: 300, lane: 'kick', strength: 2 },
    { id: 'target-b', impactTimeMs: 6750, rawTimeMs: undefined, durationMs: undefined, lane: 'snare', strength: 1 },
    { id: 'next-a', impactTimeMs: 8250, rawTimeMs: 8240, durationMs: 300, lane: 'kick', strength: 2 },
    { id: 'next-b', impactTimeMs: 10750, rawTimeMs: undefined, durationMs: undefined, lane: 'snare', strength: 1 },
  ])
})

test('treats a selected note on the next downbeat as the pattern closing boundary', () => {
  const notes = [
    note('source-a', 0, 500, 'kick'),
    note('source-b', 0, 1000, 'kick'),
    note('source-c', 1, 250, 'snare'),
    note('source-end', 2, 0, 'kick'),
    note('target-a', 2, 750, 'kick'),
    note('target-b', 2, 1250, 'kick'),
    note('target-c', 3, 1000, 'snare'),
    note('target-end', 4, 0, 'kick', { strength: 2 }),
  ]

  const result = plan(notes, ['source-a', 'source-b', 'source-c', 'source-end'])
  assert.ok(result)
  assert.equal(result.synchronizedSections, 1)
  assert.deepEqual(result.updates.map((update) => [update.id, update.impactTimeMs, update.strength]), [
    ['target-a', 4500, 1],
    ['target-b', 5000, 1],
    ['target-c', 6250, 1],
    ['target-end', 8000, 1],
  ])
})

test('stops before the first section with a per-bar count mismatch', () => {
  const notes = [
    note('source-a', 0, 0),
    note('source-b', 1, 0),
    note('matching-a', 2, 500),
    note('matching-b', 3, 500),
    note('mismatch-a', 4, 500),
    note('mismatch-extra', 4, 1000),
  ]

  const result = plan(notes, ['source-a', 'source-b'])
  assert.ok(result)
  assert.equal(result.synchronizedSections, 1)
  assert.deepEqual(result.updates.map(({ id }) => id), ['matching-a', 'matching-b'])
})

test('ignores notes outside the selected lanes', () => {
  const notes = [
    note('source', 0, 250, 'kick'),
    note('target', 1, 750, 'kick'),
    note('melody-a', 0, 500, 'mid'),
    note('melody-b', 1, 1000, 'mid'),
  ]

  const result = plan(notes, ['source'])
  assert.ok(result)
  assert.deepEqual(result.updates.map(({ id }) => id), ['target'])
})

test('refuses to propagate a partial selection within a source lane', () => {
  const notes = [note('selected', 0, 0), note('not-selected', 0, 500), note('target', 1, 1000)]
  assert.equal(plan(notes, ['selected']), null)
})

test('returns no plan when the first following section has different counts', () => {
  const notes = [note('source', 0, 0), note('target-a', 1, 250), note('target-b', 1, 500)]
  assert.equal(plan(notes, ['source']), null)
})
