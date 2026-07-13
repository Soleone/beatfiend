import test from 'node:test'
import assert from 'node:assert/strict'
import { formatUpdateError } from './update-errors.js'

test('explains when GitHub has no published latest release', () => {
  assert.equal(formatUpdateError(new Error('Unable to find latest version on GitHub (/releases/latest)')), 'No published companion update is available yet.')
})

test('does not expose raw update provider errors', () => {
  const raw = 'HttpError with private headers and a very long response body'
  const result = formatUpdateError(new Error(raw))
  assert.equal(result, 'Could not check for updates. Try again later.')
  assert.equal(result.includes(raw), false)
})
