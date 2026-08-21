import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { decisionCommentService } from '../../services/decisionCommentService';
import { CommentRow } from './CommentRow';
import { CommentComposer } from './CommentComposer';
import type { DecisionComment } from '../../types/decisionComment';

interface CommentThreadProps {
  decisionId: string;
}

export function CommentThread({ decisionId }: CommentThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<DecisionComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 20;

  const fetchComments = useCallback(async (reset = false) => {
    const skip = reset ? 0 : page * PAGE_SIZE;
    try {
      const result = await decisionCommentService.list(decisionId, skip, PAGE_SIZE);
      if (reset) {
        setComments(result.items);
        setPage(1);
      } else {
        setComments((prev) => [...prev, ...result.items]);
        setPage((p) => p + 1);
      }
      setTotal(result.total);
      setHasMore(result.items.length === PAGE_SIZE);
    } catch {
      // silent
    }
    setLoading(false);
    setLoadingMore(false);
  }, [decisionId, page]);

  useEffect(() => {
    fetchComments(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionId]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          fetchComments(false);
        }
      },
      { threshold: 0.1 },
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loadingMore, fetchComments]);

  const handleCommentCreated = (newComment: DecisionComment, tempId?: string) => {
    if (tempId) {
      // Replace optimistic temp comment with real one from server
      setComments((prev) => prev.map((c) => (c.id === tempId ? newComment : c)));
    } else {
      // Optimistic: add to top (for top-level) or append to parent (handled by CommentRow)
      if (!newComment.parent_comment_id) {
        setComments((prev) => [...prev, newComment]);
        setTotal((t) => t + 1);
      }
    }
  };

  const handleCommentUpdated = (updatedComment: DecisionComment, tempId?: string) => {
    if (tempId) {
      setComments((prev) => prev.map((c) => (c.id === tempId ? updatedComment : c)));
    } else {
      setComments((prev) =>
        prev.map((c) => (c.id === updatedComment.id ? updatedComment : c)),
      );
    }
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setTotal((t) => Math.max(0, t - 1));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment composer pinned at top */}
      {user && (
        <CommentComposer
          decisionId={decisionId}
          onCommentCreated={handleCommentCreated}
        />
      )}

      {/* Empty state */}
      {comments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No comments yet — be the first to weigh in
          </p>
        </div>
      )}

      {/* Comment list */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-4">
            <CommentRow
              comment={comment}
              decisionId={decisionId}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          </div>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {loadingMore && (
        <div className="flex justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      )}

      {!hasMore && comments.length > 0 && (
        <p className="text-center text-xs text-gray-400 py-2">
          {total} {total === 1 ? 'comment' : 'comments'}
        </p>
      )}
    </div>
  );
}
