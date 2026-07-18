import { useCallback, useRef, useState } from 'react'
import type { SongPackage } from '../domain/song-package'
import type { ImportResult } from '../game/model'
import { attachBrowserAudioToPackage, readAudioFileDurationMs } from './browser-audio-attachment'
import type { SongPackageRepository } from './song-package-repository'

export function useBrowserAudioAttachment({
  loadImport,
  packageRepository,
  packageToImport,
  setStatus,
}: {
  loadImport: (song: ImportResult) => Promise<void>
  packageRepository: SongPackageRepository
  packageToImport: (songPackage: SongPackage) => Promise<ImportResult>
  setStatus: (status: string) => void
}) {
  const [targetId, setTargetId] = useState<string | null>(null)
  const [isAttaching, setIsAttaching] = useState(false)
  const pending = useRef(false)

  const attach = useCallback(async (file: File) => {
    if (!targetId || pending.current) return
    pending.current = true
    setIsAttaching(true)
    setStatus(`Checking ${file.name}...`)
    try {
      const [durationMs, targetPackage] = await Promise.all([
        readAudioFileDurationMs(file),
        packageRepository.get(targetId),
      ])
      if (!targetPackage) throw new Error('Song package not found')
      const expectedDurationMs = targetPackage.song.durationMs
      const durationDifferenceMs = expectedDurationMs === undefined ? 0 : Math.abs(expectedDurationMs - durationMs)
      if (durationDifferenceMs > 1_000 && !window.confirm(`This file differs from ${targetPackage.song.title} by ${Math.round(durationDifferenceMs / 1000)} seconds. Attach it anyway? The beatmap timing may not match.`)) {
        setStatus('Audio attachment cancelled. The existing audio was not changed.')
        return
      }

      setStatus(`Attaching ${file.name} to ${targetPackage.song.title}...`)
      const { songPackage, storageIsPersistent } = await attachBrowserAudioToPackage({ file, packageId: targetId, repository: packageRepository })
      await loadImport(await packageToImport(songPackage))
      setStatus(durationDifferenceMs > 1_000
        ? `Attached local audio to ${songPackage.song.title}. Its duration differs by ${Math.round(durationDifferenceMs / 1000)}s, so timing may not match.`
        : storageIsPersistent
          ? `Attached local audio to ${songPackage.song.title}.`
          : `Attached local audio to ${songPackage.song.title}. Keep the original file because this browser may clear stored audio.`)
    } catch (error) {
      setStatus(error instanceof Error ? `Audio attachment failed: ${error.message}` : 'Audio attachment failed')
    } finally {
      pending.current = false
      setIsAttaching(false)
    }
  }, [loadImport, packageRepository, packageToImport, setStatus, targetId])

  return { attach, isAttaching, setTargetId, targetId }
}
