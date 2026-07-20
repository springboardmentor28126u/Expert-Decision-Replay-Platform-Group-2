import React, { useState } from 'react';
import { Discussion, DiscussionCreate, DiscussionType } from '../../types';
import CommentForm from './CommentForm';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/helpers';

interface CommentThreadProps {
  discussion: Discussion;
  onAddReply: (parentId: number, comment: string, type: DiscussionType) => Promise<void>;
  onDelete: (discussionId: number) => Promise<void>;
  currentUserId?: number;
  isAdmin: boolean;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  discussion,
  onAddReply,
  onDelete,
  currentUserId,
  isAdmin,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [loadingReply, setLoadingReply] = useState(false);

  const handleReplySubmit = async (comment: string, type: DiscussionType) => {
    setLoadingReply(true);
    try {
      await onAddReply(discussion.id, comment, type);
      setShowReplyForm(false);
    } finally {
      setLoadingReply(false);
    }
  };

  const isAuthor = discussion.user_id === currentUserId;
  const canDelete = isAuthor || isAdmin;

  const typeLabels = {
    comment: null,
    meeting_note: <Badge variant="secondary">Meeting Note</Badge>,
    rationale: <Badge variant="primary">Rationale</Badge>,
  };

  return (
    <div className="border-b border-border/40 py-4 last:border-0 animate-fadeIn">
      <div className="flex items-start gap-3">
        {/* User initials bubble */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-light uppercase border border-primary/20 shrink-0">
          {discussion.user?.username?.charAt(0) || 'U'}
        </div>

        {/* Comment block */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text">{discussion.user?.username}</span>
            <span className="text-xs text-text-muted">
              {discussion.created_at ? formatDate(discussion.created_at) : ''}
            </span>
            {discussion.type && typeLabels[discussion.type]}
          </div>

          <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
            {discussion.comment}
          </p>

          <div className="flex items-center gap-4 pt-1.5 text-xs text-text-muted">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="hover:text-primary-light transition-colors font-semibold"
            >
              {showReplyForm ? 'Cancel' : 'Reply'}
            </button>

            {canDelete && (
              <button
                onClick={() => onDelete(discussion.id)}
                className="hover:text-error transition-colors font-semibold"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3 bg-surface-elevated/40 border border-border/50 rounded-lg p-3">
              <CommentForm
                onSubmit={handleReplySubmit}
                loading={loadingReply}
                parentId={discussion.id}
                placeholder={`Reply to ${discussion.user?.username}...`}
                submitLabel="Reply"
              />
            </div>
          )}

          {/* Child Replies */}
          {discussion.replies && discussion.replies.length > 0 && (
            <div className="pl-6 border-l border-border/40 mt-3 space-y-4">
              {discussion.replies.map((reply) => {
                const isReplyAuthor = reply.user_id === currentUserId;
                const canDeleteReply = isReplyAuthor || isAdmin;

                return (
                  <div key={reply.id} className="flex items-start gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-hover text-[10px] font-bold text-text-secondary uppercase border border-border shrink-0">
                      {reply.user?.username?.charAt(0) || 'U'}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text">{reply.user?.username}</span>
                        <span className="text-[10px] text-text-muted">
                          {reply.created_at ? formatDate(reply.created_at) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed">
                        {reply.comment}
                      </p>
                      {canDeleteReply && (
                        <button
                          onClick={() => onDelete(reply.id)}
                          className="text-[10px] text-text-muted hover:text-error transition-colors font-semibold pt-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentThread;
