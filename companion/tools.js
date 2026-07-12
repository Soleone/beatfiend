import { access, chmod, mkdir, rename, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

// Production URLs and checksums must be reviewed before enabling downloads.
// Development defaults use commands on PATH or explicit environment overrides.
export const PINNED_TOOL_MANIFEST = Object.freeze({
  manifestVersion: 1,
  tools: {},
})

export function configuredTools(env = process.env) {
  return {
    ytDlp: env.BEAT_FIEND_YT_DLP ?? 'yt-dlp',
    ffmpeg: env.BEAT_FIEND_FFMPEG ?? 'ffmpeg',
    ffprobe: env.BEAT_FIEND_FFPROBE ?? 'ffprobe',
  }
}

export async function provisionPinnedTool({ name, platformKey, dataDir, fetchImpl = fetch, manifest = PINNED_TOOL_MANIFEST }) {
  const descriptor = manifest.tools?.[name]?.[platformKey]
  if (!descriptor?.url || !/^[a-f0-9]{64}$/.test(descriptor.sha256)) throw new Error(`No reviewed pinned ${name} binary for ${platformKey}. Configure a trusted binary override.`)
  const toolDir = path.join(dataDir, 'tools', descriptor.version)
  const destination = path.join(toolDir, descriptor.fileName)
  try { await access(destination); return destination } catch {}
  await mkdir(toolDir, { recursive: true })
  const response = await fetchImpl(descriptor.url, { redirect: 'error' })
  if (!response.ok) throw new Error(`Failed to provision ${name}: HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const checksum = createHash('sha256').update(bytes).digest('hex')
  if (checksum !== descriptor.sha256) throw new Error(`Checksum mismatch while provisioning ${name}`)
  const temporary = `${destination}.tmp`
  await writeFile(temporary, bytes, { mode: 0o700 })
  await rename(temporary, destination)
  await chmod(destination, 0o700)
  return destination
}
