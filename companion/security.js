import { createHmac, timingSafeEqual } from 'node:crypto'

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'youtu.be'])

export function normalizeSourceUrl(input) {
  let url
  try { url = new URL(String(input)) } catch { throw new Error('Invalid source URL') }
  if (url.protocol !== 'https:' || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) throw new Error('Only HTTPS YouTube URLs are supported')
  url.hostname = url.hostname.toLowerCase()
  url.hash = ''
  ;['utm_source', 'utm_medium', 'utm_campaign', 'feature', 'si'].forEach((key) => url.searchParams.delete(key))
  url.searchParams.sort()
  return url.toString()
}

export function isAllowedHost(host, port) {
  return host === `127.0.0.1:${port}` || host === `localhost:${port}`
}

export function secureEqual(left, right) {
  const a = Buffer.from(String(left))
  const b = Buffer.from(String(right))
  return a.length === b.length && timingSafeEqual(a, b)
}

export function signPlayback(secret, audioId, expiresAt) {
  return createHmac('sha256', secret).update(`${audioId}.${expiresAt}`).digest('base64url')
}

export function verifyPlayback(secret, audioId, expiresAt, signature, now = Date.now()) {
  const expiry = Number(expiresAt)
  return Number.isSafeInteger(expiry) && expiry > now && expiry <= now + 10 * 60_000 && secureEqual(signPlayback(secret, audioId, expiry), signature)
}
