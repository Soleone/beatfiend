import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSourceUrl, signPlayback, verifyPlayback } from './security.js'
import { parseByteRange } from './range.js'

test('normalizes supported YouTube URLs and removes tracking data', () => {
  assert.equal(normalizeSourceUrl('https://WWW.YouTube.com/watch?v=abc&si=secret&utm_source=x'), 'https://www.youtube.com/watch?v=abc')
  assert.equal(normalizeSourceUrl('https://youtu.be/abc#fragment'), 'https://youtu.be/abc')
})

test('rejects unsupported URLs and schemes', () => {
  assert.throws(() => normalizeSourceUrl('http://youtube.com/watch?v=abc'), /Only HTTPS/)
  assert.throws(() => normalizeSourceUrl('https://evil.example/?url=https://youtube.com'), /Only HTTPS/)
  assert.throws(() => normalizeSourceUrl('not a url'), /Invalid source/)
})

test('signs short-lived playback URLs', () => {
  const now = 1_000_000
  const expires = now + 60_000
  const signature = signPlayback('secret', 'audio-id', expires)
  assert.equal(verifyPlayback('secret', 'audio-id', expires, signature, now), true)
  assert.equal(verifyPlayback('secret', 'other-id', expires, signature, now), false)
  assert.equal(verifyPlayback('secret', 'audio-id', now - 1, signature, now), false)
  assert.equal(verifyPlayback('secret', 'audio-id', now + 11 * 60_000, signPlayback('secret', 'audio-id', now + 11 * 60_000), now), false)
})

test('parses normal, open, and suffix byte ranges', () => {
  assert.deepEqual(parseByteRange('bytes=2-5', 10), { start: 2, end: 5 })
  assert.deepEqual(parseByteRange('bytes=7-', 10), { start: 7, end: 9 })
  assert.deepEqual(parseByteRange('bytes=-3', 10), { start: 7, end: 9 })
  assert.throws(() => parseByteRange('bytes=20-30', 10), RangeError)
  assert.throws(() => parseByteRange('bytes=0-1,4-5', 10), RangeError)
})
