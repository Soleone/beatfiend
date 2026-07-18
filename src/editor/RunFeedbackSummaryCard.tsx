import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui'
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
  const [discardOpen, setDiscardOpen] = useState(false)
  const hasFeedback = summary.notesWithFeedback > 0
  const hasRecurringIssues = summary.repeatedIssues > 0 || summary.consistentlyEarly > 0 || summary.consistentlyLate > 0 || summary.mixedTiming > 0
  const hasLatestTimingIssues = lastRunSummary.earlyNotes > 0 || lastRunSummary.lateNotes > 0 || lastRunSummary.noInputNotes > 0
  return (
    <Card className="run-feedback-card">
      <CardHeader>
        <CardTitle>Run feedback</CardTitle>
      </CardHeader>
      {lastRun ? (
        <CardContent className="run-feedback-controls">
          <div className="run-feedback-view-control">
            <span>Timeline</span>
            <button
              type="button"
              className="run-feedback-view-toggle"
              role="switch"
              aria-checked={!showLastRunOnly}
              aria-label={showLastRunOnly ? 'Showing latest run feedback. Switch to all runs.' : 'Showing all run feedback. Switch to latest run.'}
              onClick={() => onShowLastRunOnlyChange(!showLastRunOnly)}
            >
              <span className={showLastRunOnly ? 'run-feedback-view-toggle__label run-feedback-view-toggle__label--active' : 'run-feedback-view-toggle__label'}>Latest</span>
              <span className="run-feedback-view-toggle__track" aria-hidden="true"><span className="run-feedback-view-toggle__thumb" /></span>
              <span className={!showLastRunOnly ? 'run-feedback-view-toggle__label run-feedback-view-toggle__label--active' : 'run-feedback-view-toggle__label'}>All</span>
            </button>
          </div>
          <p className="run-feedback-mode-description">{showLastRunOnly ? 'Shows only the most recent Play attempt on the timeline.' : 'Combines compatible Play attempts to reveal recurring patterns.'}</p>
        </CardContent>
      ) : null}
      {hasFeedback && !showLastRunOnly ? (
        <CardContent className="run-feedback-summary" aria-label="All run feedback">
          {hasRecurringIssues ? <div className="metric-row">
            {summary.repeatedIssues > 0 ? <Badge tone="danger">Repeated issues {summary.repeatedIssues}</Badge> : null}
            {summary.consistentlyEarly > 0 ? <Badge tone="warning">Early {summary.consistentlyEarly}</Badge> : null}
            {summary.consistentlyLate > 0 ? <Badge tone="warning">Late {summary.consistentlyLate}</Badge> : null}
            {summary.mixedTiming > 0 ? <Badge tone="danger">Mixed {summary.mixedTiming}</Badge> : null}
          </div> : <p className="run-feedback-empty">No recurring issues detected.</p>}
        </CardContent>
      ) : null}
      {lastRun && showLastRunOnly ? (
        <CardContent className="run-feedback-latest" aria-label="Latest run feedback">
          <div className="run-feedback-latest__header">
            <strong>Latest run</strong>
            <span>{lastRunSummary.notesWithFeedback} current-revision {lastRunSummary.notesWithFeedback === 1 ? 'note' : 'notes'}</span>
          </div>
          {hasLatestTimingIssues ? <div className="metric-row">
            {lastRunSummary.earlyNotes > 0 ? <Badge tone="warning">Early {lastRunSummary.earlyNotes}</Badge> : null}
            {lastRunSummary.lateNotes > 0 ? <Badge tone="danger">Late {lastRunSummary.lateNotes}</Badge> : null}
            {lastRunSummary.noInputNotes > 0 ? <Badge tone="danger">No input {lastRunSummary.noInputNotes}</Badge> : null}
          </div> : <p className="run-feedback-empty">No timing issues detected.</p>}
        </CardContent>
      ) : null}
      {!lastRun ? <CardContent className="run-feedback-empty-state"><p>Play this beatmap to collect note timing feedback.</p></CardContent> : null}
      {lastRun ? (
        <CardContent className="beatmap-secondary-actions run-feedback-secondary-actions">
          <Button type="button" variant="ghost" tooltip="Remove the latest playtest feedback" onClick={() => setDiscardOpen(true)}>
            <Trash2 />Discard latest
          </Button>
        </CardContent>
      ) : null}
      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard latest run?</DialogTitle>
            <DialogDescription>This removes the latest playtest feedback from this beatmap. Notes and beatmap edits are not changed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="secondary" />}>Cancel</DialogClose>
            <Button type="button" variant="warning" onClick={() => {
              setDiscardOpen(false)
              if (lastRun) void onDiscardRun(lastRun.id)
            }}><Trash2 />Discard run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
