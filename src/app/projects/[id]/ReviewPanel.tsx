'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './project-detail.module.css';

interface ReviewPanelProps {
  projectId: string;
}

export default function ReviewPanel({ projectId }: ReviewPanelProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          feedback: feedback.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(`Project successfully ${status.toLowerCase()}!`);
      setFeedback('');
      
      // Refresh the current server component page to show new status and logs
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.sidebarCard}>
      <h3 className={styles.sidebarCardTitle}>📋 Advisor Review Panel</h3>
      {error && (
        <div className="badge badge-rejected" style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem', textAlign: 'center', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="badge badge-approved" style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem', textAlign: 'center', borderRadius: '4px' }}>
          {success}
        </div>
      )}

      <div className={styles.reviewForm}>
        <div className={styles.textareaGroup}>
          <label htmlFor="review-feedback">Review Feedback (Optional for approval, recommended for rejection)</label>
          <textarea
            id="review-feedback"
            className={styles.feedbackTextarea}
            placeholder="Write your comments, feedback, or reasons here..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className={styles.reviewActions}>
          <button
            onClick={() => handleReview('REJECTED')}
            disabled={submitting}
            className="btn btn-danger"
            style={{ padding: '0.6rem 1rem' }}
          >
            {submitting ? 'Please wait...' : '❌ Reject'}
          </button>
          <button
            onClick={() => handleReview('APPROVED')}
            disabled={submitting}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1rem' }}
          >
            {submitting ? 'Please wait...' : '✅ Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
