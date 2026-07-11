import { Canvas } from '@react-three/fiber'
import { Arena } from './Arena'
import type { Attack, FeedbackEvent, Lane, Tuning } from './model'

type GameSceneProps = {
  attacks: Attack[]
  tuning: Tuning
  parryPulse: number
  feedback: FeedbackEvent | null
  padTriggers: Record<Lane, number>
  heldLanes: Set<Lane>
  onPhaseChange: (phase: string) => void
}

export function GameScene({ attacks, tuning, parryPulse, feedback, padTriggers, heldLanes, onPhaseChange }: GameSceneProps) {
  return (
    <Canvas camera={{ position: [0, 0.18, 7.2], fov: 42 }} dpr={1}>
      <Arena attacks={attacks} tuning={tuning} parryPulse={parryPulse} feedback={feedback} padTriggers={padTriggers} heldLanes={heldLanes} onPhaseChange={onPhaseChange} />
    </Canvas>
  )
}
