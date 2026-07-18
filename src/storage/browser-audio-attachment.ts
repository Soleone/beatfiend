import type { SongPackage } from '../domain/song-package'
import { deleteBrowserAudio, putBrowserAudio, requestPersistentBrowserStorage } from './browser-audio-repository'
import type { SongPackageRepository } from './song-package-repository'

export async function readAudioFileDurationMs(file: Blob): Promise<number> {
  const objectUrl = URL.createObjectURL(file)
  try {
    return await new Promise<number>((resolve, reject) => {
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration * 1000 : 0)
      audio.onerror = () => reject(new Error('The browser could not read this audio file'))
      audio.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function attachBrowserAudioToPackage({
  file,
  packageId,
  repository,
}: {
  file: File
  packageId: string
  repository: SongPackageRepository
}): Promise<{ songPackage: SongPackage; storageIsPersistent: boolean }> {
  const songPackage = await repository.get(packageId)
  if (!songPackage) throw new Error('Song package not found')

  const previousAssociation = await repository.getAudioAssociation(packageId)
  const audioId = crypto.randomUUID()
  const sourceUrl = songPackage.song.sources.find((source) => source.url)?.url

  await putBrowserAudio(audioId, file)
  try {
    await repository.setAudioAssociation(packageId, {
      audioId,
      storage: 'browser',
      ...(sourceUrl ? { sourceUrl } : {}),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    await deleteBrowserAudio(audioId).catch(() => undefined)
    throw error
  }

  if (previousAssociation?.storage === 'browser' && previousAssociation.audioId !== audioId) {
    await deleteBrowserAudio(previousAssociation.audioId).catch(() => undefined)
  }

  return { songPackage, storageIsPersistent: await requestPersistentBrowserStorage() }
}
