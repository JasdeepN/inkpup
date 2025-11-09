import React from 'react';

function JobSummary({ jobSummary }: { jobSummary: any }) {
  const pendingTotal = jobSummary.queued + jobSummary.scheduled;
  const nextRetryDisplay = jobSummary.nextReadyAt ? new Date(jobSummary.nextReadyAt).toLocaleString() : null;
  const oldestQueuedDisplay = jobSummary.oldestQueuedAt ? new Date(jobSummary.oldestQueuedAt).toLocaleString() : null;
  return (
    <div className="admin-card admin-card--compact admin-header__status" aria-live="polite">
      <div className="admin-card__header">
        <h2>Upload processing status</h2>
        <p className="text-muted">Queued uploads appear after the worker finishes processing pending jobs.</p>
      </div>
      <div>
        <p><strong>Queued:</strong> {jobSummary.queued}</p>
        <p><strong>Scheduled retries:</strong> {jobSummary.scheduled}</p>
        <p><strong>Dead-lettered:</strong> {jobSummary.deadLetter}</p>
        {pendingTotal > 0 && oldestQueuedDisplay && (
          <p className="text-muted">Oldest queued: {oldestQueuedDisplay}</p>
        )}
        {jobSummary.scheduled > 0 && nextRetryDisplay && (
          <p className="text-muted">Next retry: {nextRetryDisplay}</p>
        )}
      </div>
    </div>
  );
}

export default JobSummary;
