import { Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Switch } from '../components/ui'
import type { LastRunFeedbackSummary, RunFeedbackSummary } from '../game/run-feedback-aggregation'
import type { PlayRun } from '../game/run-history'

export function RunFeedbackSummaryCard({
  summary,
  lastRunSummary,
  lastRun,
  showLastRunOnly,
  onShowLastRunOnlyChange,
  onDiscardRun,
}: {
  summary: RunFeedbackSummary
  lastRunSummary: LastRunFeedbackSummary
  lastRun: PlayRun | null
  showLastRunOnly: boolean
  onShowLastRunOnlyChange: (checked: boolean) => void
  onDiscardRun: (runId: string) => Promise<void>
}) {
  const hasFeedback = summary.notesWithFeedback > 0
  return (
    <Card>
      <CardHeader>
        <CardTitle>Run feedback</CardTitle>
        <CardDescription>
          {hasFeedback ? 'Aggregates all Play attempts that match each note’s current timing, lane, and duration.' : 'Play this beatmap to collect note timing feedback.'}
        </CardDescription>
      </CardHeader>
      {hasFeedback ? (
        <CardContent className="run-feedback-summary">
          <div className="metric-row">
            <Badge tone="muted">Notes {summary.notesWithFeedback}</Badge>
            <Badge tone={summary.repeatedIssues > 0 ? 'danger' : 'success'}>Repeated issues {summary.repeatedIssues}</Badge>
          </div>
          <div className="metric-row">
            <Badge tone="warning">Early {summary.consistentlyEarly}</Badge>
            <Badge tone="warning">Late {summary.consistentlyLate}</Badge>
            <Badge tone={summary.mixedTiming > 0 ? 'danger' : 'muted'}>Mixed {summary.mixedTiming}</Badge>
          </div>
          <p>Changing a note’s timing, lane, or duration resets only that note’s feedback. Unchanged notes keep their history.</p>
        </CardContent>
      ) : null}
      {lastRun ? (
        <CardContent className="run-feedback-latest" aria-label="Latest run comparison">
          <div className="run-feedback-latest__header">
            <strong>Latest run</strong>
            <span>{lastRunSummary.notesWithFeedback} current-revision {lastRunSummary.notesWithFeedback === 1 ? 'note' : 'notes'}</span>
          </div>
          <div className="run-feedback-latest__row">
            <span>Outcome</span>
            <div className="metric-row">
              <Badge tone="success">Perfect {lastRunSummary.perfectNotes}</Badge>
              <Badge tone="warning">Good {lastRunSummary.goodNotes}</Badge>
              <Badge tone="danger">Needs work {lastRunSummary.needsWorkNotes}</Badge>
            </div>
          </div>
          <div className="run-feedback-latest__row">
            <span>Timing</span>
            <div className="metric-row">
              <Badge tone="warning">Early {lastRunSummary.earlyNotes}</Badge>
              <Badge tone="success">On time {lastRunSummary.onTimeNotes}</Badge>
              <Badge tone="danger">Late {lastRunSummary.lateNotes}</Badge>
              <Badge tone="danger">No input {lastRunSummary.noInputNotes}</Badge>
            </div>
          </div>
        </CardContent>
      ) : null}
      {lastRun ? (
        <CardContent className="run-feedback-controls">
          <div className="run-feedback-view-setting">
            <div>
              <strong>Show last run on timeline</strong>
              <span>The summary above always includes all revision-compatible runs.</span>
            </div>
            <Switch
              checked={showLastRunOnly}
              onCheckedChange={onShowLastRunOnlyChange}
              label="Last run only"
              className="run-feedback-view-switch"
              aria-label="Show last run on timeline"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="run-feedback-discard"
            onClick={() => {
              if (window.confirm('Discard the most recent run and recompute editor feedback?')) void onDiscardRun(lastRun.id)
            }}
          >
            <Trash2 />Discard latest run
          </Button>
        </CardContent>
      ) : null}
    </Card>
  )
}
