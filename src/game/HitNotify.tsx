import type { FeedbackEvent } from './model'

export function HitNotify({ feedback }: { feedback: FeedbackEvent | null }) {
  if (!feedback) return null
  const isPerfect = feedback.kind === 'perfect-parry'
  const isGood = feedback.kind === 'good-parry'
  return (
    <div key={feedback.id} className={`hit-notify ${isPerfect ? 'hit-notify--perfect' : isGood ? 'hit-notify--good' : 'hit-notify--miss'}`} aria-live="polite">
      <span className="hit-notify__icon">{isGood || isPerfect ? '✓' : '×'}</span>
      <span className="hit-notify__label">{isPerfect ? 'Perfect' : isGood ? 'Hit' : 'Miss'}</span>
    </div>
  )
}
