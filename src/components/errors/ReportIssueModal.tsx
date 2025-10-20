'use client';

import { logger } from '@/lib/logger';
/**
 * Report Issue Modal
 *
 * Allows users to provide additional context when reporting errors
 */

import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { logClientError } from '@/lib/error-tracking-client';

interface ReportIssueModalProps {
  error: Error | null;
  onClose: () => void;
}

export function ReportIssueModal({ error, onClose }: ReportIssueModalProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) return;

    setIsSubmitting(true);

    try {
      if (error) {
        await logClientError(error, {}, description);
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      logger.error('Failed to submit report:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg shadow-2xl p-6"
        style={{ background: 'var(--bg-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Report Issue</h3>
          <button
            onClick={onClose}
            className="p-1 rounded transition-all hover:opacity-70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: 'var(--accent-primary-light)' }}
            >
              <Send className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-semibold mb-2">
              Thank you for your report!
            </h4>
            <p>We&apos;ll investigate this issue and work on a fix.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
              >
                What were you trying to do when this error occurred?
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--bg-quaternary)',
                }}
                rows={4}
                placeholder="e.g., I was trying to add a restaurant to my collection..."
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1"
                variant="secondary"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                variant="primary"
                disabled={isSubmitting || !description.trim()}
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
