import { parseSongPackage, type SongPackage } from '../domain/song-package'

const INDEX_KEY = 'beat-fiend:packages:index:v1'
const PACKAGE_PREFIX = 'beat-fiend:packages:item:v1:'
const AUDIO_PREFIX = 'beat-fiend:packages:audio:v1:'

export type SongPackageSummary = {
  id: string
  title: string
  artist?: string
  durationMs?: number
  updatedAt: string
  beatmapCount: number
}

export type AudioAssociation = {
  audioId: string
  storage?: 'companion' | 'browser'
  sourceUrl?: string
  updatedAt: string
}

export interface SongPackageRepository {
  list(): Promise<SongPackageSummary[]>
  get(id: string): Promise<SongPackage | null>
  put(songPackage: SongPackage): Promise<void>
  delete(id: string): Promise<void>
  getAudioAssociation(packageId: string): Promise<AudioAssociation | null>
  setAudioAssociation(packageId: string, association: AudioAssociation): Promise<void>
}

const packageKey = (id: string) => `${PACKAGE_PREFIX}${encodeURIComponent(id)}`
const audioKey = (id: string) => `${AUDIO_PREFIX}${encodeURIComponent(id)}`

function summaryOf(songPackage: SongPackage): SongPackageSummary {
  return { id: songPackage.id, title: songPackage.song.title, ...(songPackage.song.artist ? { artist: songPackage.song.artist } : {}), ...(songPackage.song.durationMs !== undefined ? { durationMs: songPackage.song.durationMs } : {}), updatedAt: songPackage.updatedAt, beatmapCount: songPackage.beatmaps.length }
}

function readIndex(storage: Storage): SongPackageSummary[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(INDEX_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is SongPackageSummary => typeof item === 'object' && item !== null && typeof (item as SongPackageSummary).id === 'string' && typeof (item as SongPackageSummary).title === 'string')
  } catch {
    return []
  }
}

export function createLocalStorageSongPackageRepository(storage: Storage = localStorage): SongPackageRepository {
  return {
    async list() {
      return readIndex(storage).toSorted((a, b) => a.title.localeCompare(b.title))
    },
    async get(id) {
      const serialized = storage.getItem(packageKey(id))
      if (!serialized) return null
      return parseSongPackage(JSON.parse(serialized))
    },
    async put(songPackage) {
      const validated = parseSongPackage(songPackage)
      storage.setItem(packageKey(validated.id), JSON.stringify(validated))
      const next = readIndex(storage).filter((item) => item.id !== validated.id)
      next.push(summaryOf(validated))
      storage.setItem(INDEX_KEY, JSON.stringify(next))
    },
    async delete(id) {
      storage.removeItem(packageKey(id))
      storage.removeItem(audioKey(id))
      storage.setItem(INDEX_KEY, JSON.stringify(readIndex(storage).filter((item) => item.id !== id)))
    },
    async getAudioAssociation(packageId) {
      try {
        const value: unknown = JSON.parse(storage.getItem(audioKey(packageId)) ?? 'null')
        if (typeof value !== 'object' || value === null || typeof (value as AudioAssociation).audioId !== 'string' || typeof (value as AudioAssociation).updatedAt !== 'string') return null
        return value as AudioAssociation
      } catch {
        return null
      }
    },
    async setAudioAssociation(packageId, association) {
      if (!association.audioId) throw new Error('Missing companion audio id')
      storage.setItem(audioKey(packageId), JSON.stringify(association))
    },
  }
}
