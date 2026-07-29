import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { decisionCommentService } from '../../services/decisionCommentService';
import { CommentComposer } from './CommentComposer';
import { ReplyList } from './ReplyList';
import type { DecisionComment } from '../../types/decisionComment';
import { IconHeart, IconMessageCircle, IconDots, IconPencil, IconTrash } from '@tabler/icons-react';

interface CommentRowProps {
  comment: DecisionComment;
  decisionId: string;
  isReply?: boolean;
  onCommentUpdated: (comment: DecisionComment, tempId?: string) => void;
  onCommentDeleted: (commentId: string) => void;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CommentRow({
  comment,
  decisionId,
  isReply = false,
  onCommentUpdated,
  onCommentDeleted,
}: CommentRowProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(comment.liked_by_me);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [animating, setAnimating] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);

  const isAuthor = user?.id === comment.author_id;
  const isRemoved = comment.content === '[removed]';

  const handleLike = useCallback(async () => {
    if (animating) return;
    setAnimating(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      const result = await decisionCommentService.toggleLike(decisionId, comment.id);
      setLiked(result.liked);
      setLikeCount(result.like_count);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
    setTimeout(() => setAnimating(false), 300);
  }, [liked, likeCount, animating, decisionId, comment.id]);

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setEditing(false);
      return;
    }
    try {
      const updated = await decisionCommentService.update(decisionId, comment.id, { content: editContent.trim() });
      onCommentUpdated(updated);
      setEditing(false);
    } catch {
      // keep editing state
    }
  };

  const handleDelete = async () => {
    try {
      await decisionCommentService.delete(decisionId, comment.id);
      onCommentDeleted(comment.id);
    } catch {
      // silent
    }
    setShowMenu(false);
  };

  const handleReplyCreated = (newComment: DecisionComment, tempId?: string) => {
    onCommentUpdated(newComment, tempId);
    setShowReplyBox(false);
    setShowReplies(true);
  };

  const renderContent = (text: string) => {
    // Highlight @mentions
    const parts = text.split(/(@\w+(?:\s\w+)*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-indigo-600 dark:text-indigo-400 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={`group ${isReply ? 'ml-8 pl-4 border-l-2 border-gray-100 dark:border-gray-800' : ''}`}>
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
          {comment.author?.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Comment body — Instagram compact: author + text on same line */}
          <div className="text-sm">
            <span className="font-semibold text-gray-900 dark:text-white mr-1.5">
              {comment.author?.full_name || 'Unknown'}
            </span>
            {editing ? (
              <div className="mt-1">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={handleEdit} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Save</button>
                  <button onClick={() => { setEditing(false); setEditContent(comment.content); }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
              </div>
            ) : (
              <span className="text-gray-800 dark:text-gray-200">
                {isRemoved ? (
                  <span className="italic text-gray-400">[removed]</span>
                ) : (
                  renderContent(comment.content)
                )}
              </span>
            )}
            {comment.is_edited && !isRemoved && (
              <span className="text-xs text-gray-400 ml-1">(edited)</span>
            )}
          </div>

          {/* Action row — like + reply + timestamp */}
          {!isRemoved && !editing && (
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatRelativeTime(comment.created_at)}</span>
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-1 transition-colors ${
                  liked ? 'text-red-500' : 'hover:text-red-400'
                }`}
              >
                <IconHeart
                  size={14}
                  className={`transition-transform ${liked ? 'fill-red-500 scale-110' : ''} ${animating ? 'animate-bounce' : ''}`}
                />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              {!isReply && (
                <button
                  onClick={() => setShowReplyBox(!showReplyBox)}
                  className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <IconMessageCircle size={14} />
                  Reply
                </button>
              )}
              {isAuthor && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <IconDots size={14} />
                  </button>
                  {showMenu && (
                    <div className="absolute z-40 left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                      <button
                        onClick={() => { setEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                      >
                        <IconPencil size={14} /> Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-red-600 dark:text-red-400"
                      >
                        <IconTrash size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reply composer */}
          {showReplyBox && (
            <div className="mt-2">
              <CommentComposer
                decisionId={decisionId}
                parentId={comment.parent_comment_id || comment.id}
                placeholder={`Reply to ${comment.author?.full_name || 'this comment'}...`}
                autoFocus
                compact
                onCommentCreated={handleReplyCreated}
                onCancel={() => setShowReplyBox(false)}
              />
            </div>
          )}

          {/* Reply previews / "View all X replies" */}
          {!isReply && comment.reply_count > 0 && (
            <div className="mt-2">
              {!showReplies ? (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  — View {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                </button>
              ) : (
                <ReplyList
                  commentId={comment.id}
                  decisionId={decisionId}
                  onCommentUpdated={onCommentUpdated}
                  onCommentDeleted={onCommentDeleted}
                  onCollapse={() => setShowReplies(false)}
                />
              )}
            </div>
          )}

          {/* Inline reply previews (first 2) when replies not expanded */}
          {!isReply && !showReplies && comment.reply_previews.length > 0 && (
            <div className="mt-1 space-y-1">
              {comment.reply_previews.map((reply) => (
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
        </div>
      </div>
    </div>
  );
}
