import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseSongPackage, migrateLegacySongPackage } from '../src/domain/song-package.ts'

const fixture = async (name: string) => JSON.parse(await readFile(new URL(`../src/domain/fixtures/${name}`, import.meta.url), 'utf8'))

test('validates packages with shared and alternate timing profiles', async () => {
  const shared = parseSongPackage(await fixture('shared-timing.song-package.json'))
  assert.equal(shared.beatmaps.length, 2)
  assert.equal(shared.beatmaps[0].timingProfileId, shared.beatmaps[1].timingProfileId)
  const alternate = parseSongPackage(await fixture('alternate-timing.song-package.json'))
  assert.equal(alternate.timingProfiles.length, 2)
  assert.notEqual(alternate.beatmaps[0].timingProfileId, alternate.beatmaps[1].timingProfileId)
})

test('rejects audio and local transport data in portable packages', async () => {
  const invalid = await fixture('invalid-audio.song-package.json')
  assert.throws(() => parseSongPackage(invalid), /not portable/)
})

test('migrates song-level timing without losing custom notes', () => {
  const migrated = migrateLegacySongPackage({ id: 'legacy', title: 'Legacy', sourceUrl: 'https://youtu.be/legacy', bpm: 104, beatOffsetMs: 75, durationMs: 5000, beatmap: { id: 'custom', title: 'Custom', difficulty: 3, durationMs: 5000, notes: [{ id: 'n1', impactTimeMs: 250, lane: 'snare', strength: 1, source: 'manual' }] } }, '2026-07-11T00:00:00.000Z')
  assert.equal(migrated.timingProfiles[0].bpm, 104)
  assert.equal(migrated.timingProfiles[0].beatOffsetMs, 75)
  assert.equal(migrated.beatmaps[0].notes[0].id, 'n1')
})

test('creates alternate profiles for materially different legacy map timing', () => {
  const migrated = migrateLegacySongPackage({ id: 'legacy', title: 'Legacy', bpm: 104, beatOffsetMs: 0, beatmaps: [
    { id: 'shared', title: 'Shared', difficulty: 1, durationMs: 1000, bpm: 104, beatOffsetMs: 0, notes: [] },
    { id: 'alternate', title: 'Alternate', difficulty: 2, durationMs: 1000, bpm: 120, beatOffsetMs: -25, notes: [] },
  ] }, '2026-07-11T00:00:00.000Z')
  assert.equal(migrated.timingProfiles.length, 2)
  assert.notEqual(migrated.beatmaps[0].timingProfileId, migrated.beatmaps[1].timingProfileId)
  assert.equal(migrated.timingProfiles[1].beatOffsetMs, -25)
})

test('sanitizes unknown package and note fields', async () => {
  const input = await fixture('shared-timing.song-package.json')
  input.absolutePath = '/private/audio.m4a'
  input.song.playbackUri = 'signed-secret'
  input.beatmaps[0].notes.push({ id: 'extra', impactTimeMs: 10, lane: 'kick', strength: 1, source: 'manual', resolved: true })
  const parsed = parseSongPackage(input) as unknown as Record<string, unknown>
  assert.equal(parsed.absolutePath, undefined)
  assert.equal((parsed.song as Record<string, unknown>).playbackUri, undefined)
  assert.equal((parsed.beatmaps as Array<{ notes: Array<Record<string, unknown>> }>)[0].notes.at(-1)?.resolved, undefined)
})
