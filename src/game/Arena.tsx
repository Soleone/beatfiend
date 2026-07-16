import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CollectionReservoir } from './CollectionReservoir'
import { LaneStation } from './LaneStation'
import { ProjectileVisual } from './ProjectileVisual'
import { makePlayfieldBeatDividers } from './playfield-grid'
import { attackPhase } from './timing'
import { lanes, type Attack, type Lane, type LaneFeedback, type Tuning } from './model'

type ArenaProps = {
  attacks: Attack[]
  tuning: Tuning
  bpm: number
  collectionProgress: Record<Lane, number>
  collectionTotals: Record<Lane, number>
  laneFeedback: LaneFeedback
  padTriggers: Record<Lane, number>
  heldLanes: Set<Lane>
  onPhaseChange: (phase: string) => void
}

export function Arena({ attacks, tuning, bpm, collectionProgress, collectionTotals, laneFeedback, padTriggers, heldLanes, onPhaseChange }: ArenaProps) {
  const publishedPhase = useRef('queued')
  const primaryAttack = attacks[0]
  const beatDividers = useMemo(() => makePlayfieldBeatDividers(bpm, tuning.telegraphMs), [bpm, tuning.telegraphMs])
  const attacksByLane = useMemo(() => {
    const grouped: Record<Lane, Attack[]> = { kick: [], snare: [], low: [], mid: [], high: [] }
    for (const attack of attacks) grouped[attack.lane ?? 'mid'].push(attack)
    return grouped
  }, [attacks])

  useFrame(() => {
    const now = performance.now()
    const rawPhase = primaryAttack ? attackPhase(now, primaryAttack.startMs, primaryAttack.impactMs, tuning.recoveryMs) : 'queued'
    const nextPhase = rawPhase === 'windup' ? 'incoming' : rawPhase
    if (nextPhase === publishedPhase.current) return
    publishedPhase.current = nextPhase
    onPhaseChange(nextPhase)
  })

  return <>
    <color attach="background" args={["#050611"]} />
    <ambientLight intensity={0.72} />
    <directionalLight position={[0, 4, 5]} intensity={2.25} />
    <mesh position={[0, -0.92, 0]}><boxGeometry args={[6.2, 0.04, 1.4]} /><meshStandardMaterial color="#151d35" roughness={0.72} metalness={0.22} /></mesh>
    <mesh position={[0, -0.89, 0.2]}><boxGeometry args={[5.6, 0.012, 0.16]} /><meshBasicMaterial color="#28345a" transparent opacity={0.42} /></mesh>
    <mesh position={[-1.08, 0.1, -0.05]}><boxGeometry args={[0.08, 1.72, 0.08]} /><meshStandardMaterial color="#11192c" metalness={0.55} roughness={0.45} /></mesh>

    {beatDividers.map((divider, index) => <mesh key={`${divider.strength}-${index}`} position={[divider.x, 0.1, -0.015]}>
      <boxGeometry args={[divider.strength === 'beat' ? 0.012 : 0.007, 1.58, 0.018]} />
      <meshBasicMaterial color="#8fa8d4" transparent opacity={divider.strength === 'beat' ? 0.13 : 0.065} depthWrite={false} toneMapped={false} />
    </mesh>)}

    {lanes.map((lane) => <CollectionReservoir key={`collection-${lane}`} lane={lane} progress={collectionProgress[lane]} total={collectionTotals[lane]} feedback={laneFeedback[lane]} />)}
    {lanes.map((lane) => <LaneStation key={`station-${lane}`} lane={lane} attacks={attacksByLane[lane]} feedback={laneFeedback[lane]} padTrigger={padTriggers[lane]} held={heldLanes.has(lane)} />)}
    {attacks.map((attack) => <ProjectileVisual key={attack.id} attack={attack} />)}
  </>
}
