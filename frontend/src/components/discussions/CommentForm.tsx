import React, { useState } from 'react';
import Button from '../common/Button';
import { DiscussionType } from '../../types';

interface CommentFormProps {
  onSubmit: (comment: string, type: DiscussionType) => Promise<void>;
  loading: boolean;
  parentId?: number;
  placeholder?: string;
  submitLabel?: string;
  showTypeSelector?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  loading,
  parentId,
  placeholder = 'Add a comment...',
  submitLabel = 'Post',
  showTypeSelector = false,
}) => {
  const [comment, setComment] = useState('');
  const [type, setType] = useState<DiscussionType>('comment');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await onSubmit(comment.trim(), type);
      setComment('');
    } catch (error) {
      console.error('Failed to post comment', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="w-full">
        <textarea
          rows={parentId ? 2 : 3}
          className="input-field resize-y"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={placeholder}
          required
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {showTypeSelector && !parentId ? (
          <div className="flex gap-1 bg-surface-elevated rounded-md p-1 border border-border">
            {(['comment', 'meeting_note', 'rationale'] as DiscussionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                  type === t
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}

        <Button type="submit" variant="primary" size="sm" loading={loading} disabled={!comment.trim()}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;
