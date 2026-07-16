import { lanes, type BeatmapNote, type Lane } from '../game/model.ts'

export type PatternSyncPlan = {
  updates: BeatmapNote[]
  synchronizedSections: number
}

type PatternSyncOptions = {
  notes: BeatmapNote[]
  selectedNoteIds: ReadonlySet<string>
  bpm: number
  beatOffsetMs: number
  songEndMs: number
}

const boundaryEpsilonMs = 0.5

const barIndexAt = (timeMs: number, beatOffsetMs: number, barMs: number) =>
  Math.floor((timeMs - beatOffsetMs) / barMs)

const barStartAt = (barIndex: number, beatOffsetMs: number, barMs: number) =>
  beatOffsetMs + barIndex * barMs

const comparePatternNotes = (barStartMs: number) => (left: BeatmapNote, right: BeatmapNote) =>
  (left.impactTimeMs - barStartMs) - (right.impactTimeMs - barStartMs)
  || lanes.indexOf(left.lane) - lanes.indexOf(right.lane)
  || left.id.localeCompare(right.id)

const noteMatchesUpdate = (note: BeatmapNote, update: BeatmapNote) =>
  note.impactTimeMs === update.impactTimeMs
  && note.rawTimeMs === update.rawTimeMs
  && note.durationMs === update.durationMs
  && note.lane === update.lane
  && note.strength === update.strength

const makeUpdate = (
  sourceNote: BeatmapNote,
  sourceAnchorMs: number,
  targetNote: BeatmapNote,
  targetAnchorMs: number,
): BeatmapNote => ({
  ...targetNote,
  impactTimeMs: targetAnchorMs + (sourceNote.impactTimeMs - sourceAnchorMs),
  rawTimeMs: sourceNote.rawTimeMs === undefined
    ? undefined
    : targetAnchorMs + (sourceNote.rawTimeMs - sourceAnchorMs),
  durationMs: sourceNote.durationMs,
  lane: sourceNote.lane,
  strength: sourceNote.strength,
})

export function planPatternSync({
  notes,
  selectedNoteIds,
  bpm,
  beatOffsetMs,
  songEndMs,
}: PatternSyncOptions): PatternSyncPlan | null {
  if (selectedNoteIds.size === 0 || !Number.isFinite(bpm) || bpm <= 0 || songEndMs <= 0) return null

  const selectedNotes = notes.filter((note) => selectedNoteIds.has(note.id))
  if (selectedNotes.length === 0) return null

  const barMs = 4 * (60000 / bpm)
  const firstSelectedBar = Math.min(...selectedNotes.map((note) => barIndexAt(note.impactTimeMs, beatOffsetMs, barMs)))
  const lastSelectedBar = Math.max(...selectedNotes.map((note) => barIndexAt(note.impactTimeMs, beatOffsetMs, barMs)))
  const sourceStartMs = barStartAt(firstSelectedBar, beatOffsetMs, barMs)
  const possibleClosingBoundaryMs = barStartAt(lastSelectedBar, beatOffsetMs, barMs)
  const lastBarNotes = selectedNotes.filter((note) => barIndexAt(note.impactTimeMs, beatOffsetMs, barMs) === lastSelectedBar)
  const selectionStartsOnBoundary = selectedNotes.some((note) => Math.abs(note.impactTimeMs - sourceStartMs) <= boundaryEpsilonMs)
  const hasClosingBoundary = lastSelectedBar > firstSelectedBar
    && !selectionStartsOnBoundary
    && lastBarNotes.every((note) => Math.abs(note.impactTimeMs - possibleClosingBoundaryMs) <= boundaryEpsilonMs)
  const sourceEndBar = hasClosingBoundary ? lastSelectedBar - 1 : lastSelectedBar
  const sourceEndMs = barStartAt(sourceEndBar + 1, beatOffsetMs, barMs)
  const sourceLanes = new Set<Lane>(selectedNotes.map((note) => note.lane))
  const scopedSourceNotes = notes.filter((note) =>
    sourceLanes.has(note.lane)
    && note.impactTimeMs >= sourceStartMs - boundaryEpsilonMs
    && (hasClosingBoundary
      ? note.impactTimeMs <= sourceEndMs + boundaryEpsilonMs
      : note.impactTimeMs < sourceEndMs),
  )

  // A partial selection within one of the source lanes is ambiguous and unsafe to propagate.
  if (scopedSourceNotes.length !== selectedNotes.length || scopedSourceNotes.some((note) => !selectedNoteIds.has(note.id))) return null

  const barCount = sourceEndBar - firstSelectedBar + 1
  const sourceNotesByBar = Array.from({ length: barCount }, (_, relativeBar) => {
    const barStartMs = barStartAt(firstSelectedBar + relativeBar, beatOffsetMs, barMs)
    return selectedNotes
      .filter((note) => note.impactTimeMs >= barStartMs && note.impactTimeMs < barStartMs + barMs)
      .toSorted(comparePatternNotes(barStartMs))
  })
  const sourceClosingNotes = hasClosingBoundary
    ? selectedNotes.filter((note) => Math.abs(note.impactTimeMs - sourceEndMs) <= boundaryEpsilonMs)
      .toSorted(comparePatternNotes(sourceEndMs))
    : []

  const updates: BeatmapNote[] = []
  let synchronizedSections = 0

  for (let targetStartBar = sourceEndBar + 1; ; targetStartBar += barCount) {
    const targetEndMs = barStartAt(targetStartBar + barCount, beatOffsetMs, barMs)
    if (targetEndMs > songEndMs + boundaryEpsilonMs) break

    const sectionUpdates: BeatmapNote[] = []
    let countsMatch = true

    for (let relativeBar = 0; relativeBar < barCount; relativeBar += 1) {
      const sourceBarStartMs = barStartAt(firstSelectedBar + relativeBar, beatOffsetMs, barMs)
      const targetBarStartMs = barStartAt(targetStartBar + relativeBar, beatOffsetMs, barMs)
      const sourceBarNotes = sourceNotesByBar[relativeBar]
      const targetBarNotes = notes
        .filter((note) => sourceLanes.has(note.lane)
          && note.impactTimeMs >= targetBarStartMs + (hasClosingBoundary && relativeBar === 0 ? boundaryEpsilonMs : 0)
          && note.impactTimeMs < targetBarStartMs + barMs)
        .toSorted(comparePatternNotes(targetBarStartMs))

      if (targetBarNotes.length !== sourceBarNotes.length) {
        countsMatch = false
        break
      }

      targetBarNotes.forEach((targetNote, index) => {
        const update = makeUpdate(sourceBarNotes[index], sourceBarStartMs, targetNote, targetBarStartMs)
        if (!noteMatchesUpdate(targetNote, update)) sectionUpdates.push(update)
      })
    }

    if (countsMatch && hasClosingBoundary) {
      const targetClosingNotes = notes
        .filter((note) => sourceLanes.has(note.lane) && Math.abs(note.impactTimeMs - targetEndMs) <= boundaryEpsilonMs)
        .toSorted(comparePatternNotes(targetEndMs))
      if (targetClosingNotes.length !== sourceClosingNotes.length) {
        countsMatch = false
      } else {
        targetClosingNotes.forEach((targetNote, index) => {
          const update = makeUpdate(sourceClosingNotes[index], sourceEndMs, targetNote, targetEndMs)
          if (!noteMatchesUpdate(targetNote, update)) sectionUpdates.push(update)
        })
      }
    }

    if (!countsMatch) break
    synchronizedSections += 1
    updates.push(...sectionUpdates)
  }

  return synchronizedSections > 0 && updates.length > 0 ? { updates, synchronizedSections } : null
}
