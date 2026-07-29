import { useState, useEffect } from 'react';
import { decisionCommentService } from '../../services/decisionCommentService';
import { CommentRow } from './CommentRow';
import { CommentComposer } from './CommentComposer';
import type { DecisionComment } from '../../types/decisionComment';
import { IconChevronUp } from '@tabler/icons-react';

interface ReplyListProps {
  commentId: string;
  decisionId: string;
  onCommentUpdated: (comment: DecisionComment, tempId?: string) => void;
  onCommentDeleted: (commentId: string) => void;
  onCollapse: () => void;
}

export function ReplyList({
  commentId,
  decisionId,
  onCommentUpdated,
  onCommentDeleted,
  onCollapse,
}: ReplyListProps) {
  const [replies, setReplies] = useState<DecisionComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReplies();
  }, [commentId]);

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const result = await decisionCommentService.listReplies(decisionId, commentId);
      setReplies(result.items);
      setTotal(result.total);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const handleReplyCreated = (newComment: DecisionComment, tempId?: string) => {
    if (tempId) {
      setReplies((prev) => prev.map((r) => (r.id === tempId ? newComment : r)));
    } else {
      setReplies((prev) => [...prev, newComment]);
    }
    setTotal((prev) => prev + 1);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={onCollapse}
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <IconChevronUp size={14} />
        Hide replies
      </button>

      {loading ? (
        <div className="flex justify-center py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <div className="space-y-2">
          {replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              decisionId={decisionId}
              isReply
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
            />
          ))}
        </div>
      )}

      {/* Inline reply composer */}
      <div className="ml-8 mt-2">
        <CommentComposer
          decisionId={decisionId}
          parentId={commentId}
          placeholder="Write a reply..."
          compact
          onCommentCreated={handleReplyCreated}
        />
      </div>
    </div>
  );
}
