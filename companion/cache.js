import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

export class AudioCache {
  constructor(dataDir) {
    this.dataDir = dataDir
    this.audioDir = path.join(dataDir, 'audio')
    this.indexFile = path.join(dataDir, 'library.json')
    this.items = new Map()
  }

  async init() {
    await mkdir(this.audioDir, { recursive: true })
    try {
      const items = JSON.parse(await readFile(this.indexFile, 'utf8'))
      if (Array.isArray(items)) items.forEach((item) => { if (item?.id && item?.fileName) this.items.set(item.id, item) })
    } catch {}
  }

  publicItem(item) {
    return { audioId: item.id, title: item.title, durationMs: item.durationMs, contentType: item.contentType, size: item.size, ...(item.sourceUrl ? { sourceUrl: item.sourceUrl } : {}), ...(item.extractorId ? { extractorId: item.extractorId } : {}), ...(item.codec ? { codec: item.codec } : {}) }
  }

  get(id) { return this.items.get(id) ?? null }
  filePath(item) { return path.join(this.audioDir, item.fileName) }
  bySource(sourceUrl) { return [...this.items.values()].find((item) => item.sourceUrl === sourceUrl) ?? null }

  async add(item) {
    this.items.set(item.id, item)
    await this.save()
  }

  async delete(id) {
    const item = this.items.get(id)
    if (!item) return false
    this.items.delete(id)
    await Promise.all([rm(this.filePath(item), { force: true }), this.save()])
    return true
  }

  async save() {
    const temp = `${this.indexFile}.${process.pid}.tmp`
    await writeFile(temp, `${JSON.stringify([...this.items.values()], null, 2)}\n`, { mode: 0o600 })
    await rename(temp, this.indexFile)
  }
}
