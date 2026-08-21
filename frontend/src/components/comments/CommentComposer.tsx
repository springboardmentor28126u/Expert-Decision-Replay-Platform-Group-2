import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { decisionCommentService } from '../../services/decisionCommentService';
import type { DecisionCommentCreatePayload, DecisionCommentMentionResult } from '../../types/decisionComment';
import { IconSend } from '@tabler/icons-react';

interface CommentComposerProps {
  decisionId: string;
  parentId?: string | null;
  placeholder?: string;
  autoFocus?: boolean;
  onCommentCreated: (comment: any) => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function CommentComposer({
  decisionId,
  parentId = null,
  placeholder = 'Add a comment...',
  autoFocus = false,
  onCommentCreated,
  onCancel,
  compact = false,
}: CommentComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<DecisionCommentMentionResult[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!showMentions) return;
    const fetchMentions = async () => {
      try {
        const results = await decisionCommentService.getMentionable(decisionId, mentionQuery);
        setMentionResults(results);
        setMentionIndex(0);
      } catch {
        setMentionResults([]);
      }
    };
    fetchMentions();
  }, [mentionQuery, showMentions, decisionId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Detect @ mention trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setShowMentions(true);
      setMentionQuery(atMatch[1]);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (name: string) => {
    const cursorPos = inputRef.current?.selectionStart || content.length;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const newText = textBeforeCursor.slice(0, atIndex) + `@${name} ` + textAfterCursor;
    setContent(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionResults.length) % mentionResults.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionResults[mentionIndex].full_name);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
      return;
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    setError('');

    // Optimistic: build a temporary comment for instant display
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      decision_id: decisionId,
      author_id: user!.id,
      author: { id: user!.id, full_name: user!.full_name },
      content: content.trim(),
      parent_comment_id: parentId,
      is_edited: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      like_count: 0,
      liked_by_me: false,
      reply_count: 0,
      reply_previews: [],
    };

    onCommentCreated(optimisticComment);
    setContent('');

    try {
      const payload: DecisionCommentCreatePayload = {
        content: optimisticComment.content,
        parent_comment_id: parentId,
      };
      const realComment = await decisionCommentService.create(decisionId, payload);
      // Replace the optimistic comment with the real one
      onCommentCreated(realComment);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to post comment');
      // Keep the temp comment visible with error state
    }

    setPosting(false);
  };

  if (!user) return null;

  return (
    <div className={`relative ${compact ? '' : 'flex items-start gap-3'}`}>
      {!compact && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold">
          {user.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <div className="flex-1 relative">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={compact ? 1 : 2}
            className={`w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none ${
              compact ? 'text-sm' : ''
            }`}
          />
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || posting}
            className="absolute right-2 bottom-2 p-1 rounded-lg text-indigo-600 dark:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            {posting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
            ) : (
              <IconSend size={16} />
            )}
          </button>
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}

        {showMentions && mentionResults.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 bottom-full mb-1 left-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto"
          >
            {mentionResults.map((user, idx) => (
              <button
                key={user.id}
                onClick={() => insertMention(user.full_name)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  idx === mentionIndex
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
                {user.full_name}
              </button>
            ))}
          </div>
        )}
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
