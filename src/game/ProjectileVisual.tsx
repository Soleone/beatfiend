import { useFrame } from '@react-three/fiber'
import { AdditiveBlending } from 'three'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import { useRef } from 'react'
import { PLAYFIELD_IMPACT_X, PLAYFIELD_PROJECTILE_START_X } from './playfield-grid'
import { clamp01, laneColor, laneY, missedProjectileLingerMs, type Attack } from './model'

function holdVisualLength(durationMs = 0) {
  return Math.min(1.5, 0.46 + durationMs / 2200)
}

export function ProjectileVisual({ attack }: { attack: Attack }) {
  const head = useRef<Group>(null)
  const halo = useRef<Mesh>(null)
  const ribbonSegments = useRef<Array<Mesh | null>>([])
  const ribbonMaterials = useRef<Array<MeshBasicMaterial | null>>([])
  const tether = useRef<Mesh>(null)
  const tetherCore = useRef<Mesh>(null)
  const holdPulses = useRef<Array<Mesh | null>>([])
  const ghosts = useRef<Array<Mesh | null>>([])
  const lane = attack.lane ?? 'mid'
  const color = laneColor[lane]
  const isHold = (attack.durationMs ?? 0) > 0
  const isHeavy = (attack.strength ?? 1) >= 2
  const syncopation = clamp01(attack.syncopation ?? 0)
  const holdLength = holdVisualLength(attack.durationMs)

  useFrame(() => {
    const now = performance.now()
    const impactAge = now - attack.impactMs
    const travel = clamp01((now - attack.startMs) / attack.travelMs)
    const travelX = PLAYFIELD_PROJECTILE_START_X + (PLAYFIELD_IMPACT_X - PLAYFIELD_PROJECTILE_START_X) * travel
    const missedAfterImpact = Boolean(!isHold && attack.initialMissed && impactAge >= 0)
    const missProgress = missedAfterImpact ? clamp01(impactAge / missedProjectileLingerMs) : 0
    const x = missedAfterImpact ? PLAYFIELD_IMPACT_X + missProgress * 0.12 : travelX
    const y = laneY[lane] - (missedAfterImpact ? missProgress * 0.22 : 0)
    const visibleBeforeImpact = now >= attack.startMs
    const holdProgress = isHold && impactAge >= 0 ? clamp01(impactAge / (attack.durationMs ?? 1)) : 0
    const holding = isHold && Boolean(attack.holdStarted) && impactAge >= 0 && holdProgress < 1
    const awaitingHold = isHold && !attack.holdStarted && impactAge >= 0 && holdProgress < 1
    const missVisible = missedAfterImpact && impactAge < missedProjectileLingerMs
    const headVisible = visibleBeforeImpact && (impactAge < 0 || holding || awaitingHold || missVisible)
    const energyPulse = 0.94 + Math.sin((now - attack.startMs) / 54) * 0.06
    const completionFade = holding || awaitingHold ? Math.min(1, (1 - holdProgress) * 6) : 1

    if (head.current) {
      head.current.visible = headVisible
      head.current.position.set(holding || awaitingHold ? PLAYFIELD_IMPACT_X : x, holding || awaitingHold ? laneY[lane] : y, 0.2)
      head.current.rotation.x = (now - attack.startMs) / (430 - syncopation * 110)
      head.current.rotation.z = (now - attack.startMs) / (310 - syncopation * 90)
      head.current.scale.setScalar((isHold ? 1.08 : 1) * (isHeavy ? 1.2 : 1) * energyPulse * completionFade * (missedAfterImpact ? 1 - missProgress * 0.82 : 1))
    }
    if (halo.current) halo.current.scale.setScalar(0.92 + Math.sin(now / 42) * 0.12)

    const ribbonLength = (isHeavy ? 0.4 : 0.34) - syncopation * 0.17 + Math.sin(now / 70) * 0.025
    const ribbonGap = 0.006 + syncopation * 0.028
    const ribbonSegmentLength = Math.max(0.025, (ribbonLength - ribbonGap * 2) / 3)
    const ribbonVisible = !isHold && visibleBeforeImpact && impactAge < 0
    ribbonSegments.current.forEach((segment, index) => {
      if (!segment) return
      segment.visible = ribbonVisible
      segment.position.set(x + 0.04 + ribbonSegmentLength / 2 + index * (ribbonSegmentLength + ribbonGap), laneY[lane], 0.13)
      segment.scale.x = ribbonSegmentLength
      const material = ribbonMaterials.current[index]
      if (material) material.opacity = (missedAfterImpact ? 0.42 * (1 - missProgress) : isHeavy ? 0.62 : 0.48) * (1 - index * syncopation * 0.12)
    })

    const tetherRemaining = holding || awaitingHold ? 1 - holdProgress : 1
    const activeTetherLength = Math.max(0.035, holdLength * tetherRemaining)
    const tetherVisible = isHold && visibleBeforeImpact && (impactAge < 0 || holding || awaitingHold)
    const tetherAnchorX = holding || awaitingHold ? PLAYFIELD_IMPACT_X : x
    const tetherFade = missedAfterImpact ? 1 - missProgress : Math.min(1, tetherRemaining * 4)
    if (tether.current) {
      tether.current.visible = tetherVisible
      tether.current.position.set(tetherAnchorX + activeTetherLength / 2 + 0.05, laneY[lane], 0.13)
      tether.current.scale.set(activeTetherLength, missedAfterImpact ? 0.55 + missProgress * 0.4 : 1, 1)
      ;(tether.current.material as MeshBasicMaterial).opacity = 0.36 * tetherFade
    }
    if (tetherCore.current) {
      tetherCore.current.visible = tetherVisible
      tetherCore.current.position.set(tetherAnchorX + activeTetherLength / 2 + 0.05, laneY[lane], 0.17)
      tetherCore.current.scale.set(activeTetherLength, 1, 1)
      ;(tetherCore.current.material as MeshBasicMaterial).opacity = 0.84 * tetherFade
    }
    holdPulses.current.forEach((pulse, index) => {
      if (!pulse) return
      const pulseTravel = ((now - attack.startMs) / 360 + index / 3) % 1
      pulse.visible = tetherVisible && !missedAfterImpact && activeTetherLength > 0.12
      pulse.position.set(tetherAnchorX + 0.05 + activeTetherLength * (1 - pulseTravel), laneY[lane], 0.19)
      pulse.scale.setScalar(0.72 + Math.sin(pulseTravel * Math.PI) * 0.45)
    })

    ghosts.current.forEach((ghost, index) => {
      if (!ghost) return
      const lagMs = 48 * (index + 1)
      const ghostTravel = clamp01((now - lagMs - attack.startMs) / attack.travelMs)
      ghost.position.set(PLAYFIELD_PROJECTILE_START_X + (PLAYFIELD_IMPACT_X - PLAYFIELD_PROJECTILE_START_X) * ghostTravel, laneY[lane], 0.1)
      ghost.visible = !isHold && !missedAfterImpact && now >= attack.startMs + lagMs && impactAge < 25
    })
  })

  return <>
    {[0.2, 0.1].map((opacity, index) => <mesh key={opacity} ref={(mesh) => { ghosts.current[index] = mesh }} visible={false}><sphereGeometry args={[0.07 - index * 0.012, 12, 8]} /><meshBasicMaterial color={color} transparent opacity={opacity} blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>)}
    {[0, 1, 2].map((index) => <mesh key={`ribbon-${index}`} ref={(mesh) => { ribbonSegments.current[index] = mesh }} visible={false}><boxGeometry args={[1, isHeavy ? 0.062 : 0.045, 0.025]} /><meshBasicMaterial ref={(material) => { ribbonMaterials.current[index] = material }} color={color} transparent opacity={isHeavy ? 0.62 : 0.48} blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>)}
    {isHold ? <>
      <mesh ref={tether} visible={false}><boxGeometry args={[1, 0.13, 0.035]} /><meshBasicMaterial color={color} transparent opacity={0.36} blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <mesh ref={tetherCore} visible={false}><boxGeometry args={[1, 0.035, 0.02]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.84} blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      {[0, 1, 2].map((index) => <mesh key={index} ref={(mesh) => { holdPulses.current[index] = mesh }} visible={false}><octahedronGeometry args={[0.055, 0]} /><meshBasicMaterial color="#ffffff" blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>)}
    </> : null}
    <group ref={head} visible={false}>
      <mesh ref={halo}><sphereGeometry args={[isHold ? 0.15 : isHeavy ? 0.155 : 0.125, 16, 10]} /><meshBasicMaterial color={color} transparent opacity={isHeavy ? 0.3 : 0.2} blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[isHold ? 0.105 : isHeavy ? 0.098 : 0.082, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={isHeavy ? 3 : 2.1} roughness={0.25} /></mesh>
      <mesh><sphereGeometry args={[isHold ? 0.045 : isHeavy ? 0.045 : 0.035, 12, 8]} /><meshBasicMaterial color="#ffffff" blending={AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
    </group>
  </>
}
