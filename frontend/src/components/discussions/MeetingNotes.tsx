import React from 'react';
import { Discussion } from '../../types';
import { formatDate } from '../../utils/helpers';
import Card from '../common/Card';

interface MeetingNotesProps {
  discussions: Discussion[];
}

const MeetingNotes: React.FC<MeetingNotesProps> = ({ discussions }) => {
  const notes = discussions.filter(
    (d) => d.type === 'meeting_note' || d.type === 'rationale'
  );

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-text-secondary text-sm">
        No meeting notes or formal decision rationales recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card
          key={note.id}
          className={`border-l-4 ${
            note.type === 'rationale' ? 'border-l-primary' : 'border-l-info'
          } p-4 bg-surface-elevated/40`}
        >
          <div className="flex items-center justify-between gap-3 mb-2 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-secondary">
                {note.type === 'rationale' ? 'Decision Rationale' : 'Meeting Note'}
              </span>
              <span>•</span>
              <span>Recorded by {note.user?.username}</span>
            </div>
            <span>{note.created_at ? formatDate(note.created_at) : ''}</span>
          </div>

          <p className="text-sm text-text whitespace-pre-line leading-relaxed">
            {note.comment}
          </p>
        </Card>
      ))}
    </div>
  );
};

export default MeetingNotes;
