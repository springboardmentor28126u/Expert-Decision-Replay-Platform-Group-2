import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from "../api/users";
import { approvalsApi } from "../api/approvals";
import { decisionsApi } from '../api/decisions';
import { alternativesApi } from '../api/alternatives';
import { discussionsApi } from '../api/discussions';
import { filesApi } from '../api/files';
import {
  Decision,
  Alternative,
  Discussion,
  FileAttachment,
  VersionHistory,
  DecisionStatus,
  DiscussionType,
} from '../types';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/decisions/StatusBadge';
import DecisionForm from '../components/decisions/DecisionForm';
import AlternativeForm from '../components/alternatives/AlternativeForm';
import AlternativeList from '../components/alternatives/AlternativeList';
import ComparisonChart from '../components/alternatives/ComparisonChart';
import CommentForm from '../components/discussions/CommentForm';
import CommentThread from '../components/discussions/CommentThread';
import MeetingNotes from '../components/discussions/MeetingNotes';
import FileUpload from '../components/files/FileUpload';
import FileList from '../components/files/FileList';

import { DECISION_STATUSES } from '../utils/constants';
import { formatDate } from '../utils/helpers';

const DecisionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const decisionId = parseInt(id || '0');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<number | null>(null);

  const [decision, setDecision] = useState<Decision | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [history, setHistory] = useState<VersionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'info' | 'alternatives' | 'discussions' | 'files' | 'history'>('info');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAltModalOpen, setIsAltModalOpen] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState<Alternative | null>(null);
  
  const [editLoading, setEditLoading] = useState(false);
  const [altLoading, setAltLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [decRes, altRes, discRes, fileRes, histRes] = await Promise.all([
        decisionsApi.get(decisionId),
        alternativesApi.list(decisionId),
        discussionsApi.list(decisionId),
        filesApi.list(decisionId),
        decisionsApi.getHistory(decisionId),
      ]);
      setDecision(decRes);
      setAlternatives(altRes);
      setDiscussions(discRes);
      setFiles(fileRes);
      setHistory(histRes);
    } catch (error) {
      console.error('Failed to load decision detail datasets', error);
      navigate('/dashboard/decisions');
    } finally {
      setLoading(false);
    }
    try {
    const reviewerList = await usersApi.getReviewers();
    setReviewers(reviewerList);
    } catch (err) {
  console.log(err);
}
  };

  useEffect(() => {
    if (decisionId) {
      loadAllData();
    }
  }, [decisionId]);

  if (loading || !decision) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isAdmin = user?.role === 'Administrator';
  const isManager = user?.role === 'Manager' || isAdmin;
  const isReviewer = user?.role === 'Reviewer' || isManager;
  const isAuthor = decision.created_by === user?.id;
  const canModify = isAuthor || isManager;
  const canViewApprovals = isAdmin || isManager || isReviewer;

  const handleUpdateDecision = async (formData: any) => {
    setEditLoading(true);
    try {
      await decisionsApi.update(decisionId, formData);
      setIsEditModalOpen(false);
      await loadAllData();
    } catch (err) {
      console.error('Failed to update decision', err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: DecisionStatus) => {
    try {
      await decisionsApi.updateStatus(decisionId, newStatus);
      await loadAllData();
    } catch (err) {
      console.error('Failed to transition status', err);
    }
  };

  const handleDeleteDecision = async () => {
    if (
      window.confirm(
        'Are you absolutely sure you want to delete this decision? This will delete all alternatives, discussions, and attached files permanently.'
      )
    ) {
      try {
        await decisionsApi.delete(decisionId);
        navigate('/dashboard/decisions');
      } catch (err) {
        console.error('Failed to delete decision', err);
      }
    }
  };

  const handleAddAlternative = async (formData: any) => {
    setAltLoading(true);
    try {
      if (selectedAlt) {
        await alternativesApi.update(decisionId, selectedAlt.id, formData);
      } else {
        await alternativesApi.create(decisionId, formData);
      }
      setIsAltModalOpen(false);
      setSelectedAlt(null);
      const updatedAlts = await alternativesApi.list(decisionId);
      setAlternatives(updatedAlts);
    } catch (err) {
      console.error('Failed to save alternative', err);
    } finally {
      setAltLoading(false);
    }
  };

  const handleEditAlternative = (alt: Alternative) => {
    setSelectedAlt(alt);
    setIsAltModalOpen(true);
  };

  const handleDeleteAlternative = async (altId: number) => {
    if (window.confirm('Delete this alternative evaluation?')) {
      try {
        await alternativesApi.delete(decisionId, altId);
        const updatedAlts = await alternativesApi.list(decisionId);
        setAlternatives(updatedAlts);
      } catch (err) {
        console.error('Failed to delete alternative', err);
      }
    }
  };

  const handleAddDiscussion = async (comment: string, type: DiscussionType) => {
    setCommentLoading(true);
    try {
      await discussionsApi.create(decisionId, { comment, type });
      const updatedDiscs = await discussionsApi.list(decisionId);
      setDiscussions(updatedDiscs);
    } catch (err: any) {
      console.error('Failed to add discussion', err);
      alert(err.response?.data?.detail || 'Failed to post discussion message.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddReply = async (parentId: number, comment: string, type: DiscussionType) => {
    try {
      await discussionsApi.create(decisionId, { comment, parent_id: parentId, type });
      const updatedDiscs = await discussionsApi.list(decisionId);
      setDiscussions(updatedDiscs);
    } catch (err: any) {
      console.error('Failed to add reply', err);
      alert(err.response?.data?.detail || 'Failed to post reply.');
    }
  };

  const handleDeleteDiscussion = async (discId: number) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await discussionsApi.delete(decisionId, discId);
        const updatedDiscs = await discussionsApi.list(decisionId);
        setDiscussions(updatedDiscs);
      } catch (err: any) {
        console.error('Failed to delete discussion', err);
        alert(err.response?.data?.detail || 'Failed to delete discussion comment.');
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    setFileLoading(true);
    try {
      await filesApi.upload(decisionId, file);
      const updatedFiles = await filesApi.list(decisionId);
      setFiles(updatedFiles);
    } catch (err) {
      console.error('Failed to upload file', err);
    } finally {
      setFileLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (window.confirm('Delete this attached file?')) {
      try {
        await filesApi.delete(decisionId, fileId);
        const updatedFiles = await filesApi.list(decisionId);
        setFiles(updatedFiles);
      } catch (err) {
        console.error('Failed to delete file', err);
      }
    }
  };

  return (
    <div className="section-spacing">
      {/* Top Action Breadcrumb Bar */}
      <div className="flex justify-between items-center text-sm border-b border-border pb-4">
        <button
          onClick={() => navigate('/dashboard/decisions')}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text font-semibold transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Library
        </button>

        <div className="flex gap-3">

  {canViewApprovals && (
    <Button
      variant="primary"
      size="sm"
      onClick={() => navigate(`/dashboard/decisions/${decisionId}/approvals`)}
    >
      Approvals
    </Button>
  )}

  {canModify && (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setIsEditModalOpen(true)}
    >
      Edit
    </Button>
  )}

  {isAdmin && (
    <Button
      variant="danger"
      size="sm"
      onClick={handleDeleteDecision}
    >
      Delete
    </Button>
  )}

</div>
      </div>

      {/* Main Info Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={decision.status} />
            {decision.category && (
              <span className="bg-surface-elevated border border-border text-text-secondary rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider select-none">
                {decision.category}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-text">
            {decision.title || 'Untitled Decision'}
          </h1>

          <div className="flex items-center gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary-light uppercase border border-primary/20 select-none">
                {decision.creator?.username?.charAt(0)}
              </div>
              <span className="text-text-secondary">By {decision.creator?.username}</span>
            </div>
            <span>•</span>
            <span>Recorded {decision.created_at ? formatDate(decision.created_at) : ''}</span>
          </div>
        </div>

        {/* Transition Dropdown Alignment */}
        {canModify && (
          <div className="flex flex-col w-full md:w-52">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
              Status Flow
            </label>
            <select
              value={decision.status || 'Draft'}
              onChange={(e) => handleStatusChange(e.target.value as DecisionStatus)}
              className="input-field cursor-pointer"
            >
              {DECISION_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex overflow-x-auto border-b border-border/80 gap-2 pb-px select-none">
        {(['info', 'alternatives', 'discussions', 'files', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'border-primary text-primary-light bg-primary/5'
                : 'border-transparent text-text-secondary hover:text-text hover:bg-surface-hover/30'
            }`}
          >
            {tab === 'info' ? 'details' : tab}
          </button>
        ))}
      </div>

      {/* Main Container Modules */}
      <div className="pt-2">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border border-border/80 bg-surface-elevated/20">
                <h3 className="text-base font-bold text-text mb-4 border-b border-border/40 pb-2">
                  Problem Statement & Context
                </h3>
                <div className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                  {decision.description || 'No description provided.'}
                </div>
              </Card>

              {alternatives.length > 0 && <ComparisonChart alternatives={alternatives} />}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="border border-border/80 bg-surface-elevated/20">
                <h3 className="text-sm font-bold text-text mb-3">Attached Documents</h3>
                <FileList files={files.slice(0, 3)} onDelete={handleDeleteFile} canDelete={!!user} />
                {files.length > 3 && (
                  <button
                    onClick={() => setActiveTab('files')}
                    className="text-xs text-primary-light hover:underline font-semibold w-full text-center mt-4 block"
                  >
                    View all {files.length} documents
                  </button>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'alternatives' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-text">Alternatives Comparison</h3>
              {user && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedAlt(null);
                    setIsAltModalOpen(true);
                  }}
                >
                  Add Alternative
                </Button>
              )}
            </div>

            {alternatives.length > 0 && <ComparisonChart alternatives={alternatives} />}

            <AlternativeList
              alternatives={alternatives}
              onEdit={handleEditAlternative}
              onDelete={handleDeleteAlternative}
              canEdit={!!user}
            />
          </div>
        )}

        {activeTab === 'discussions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border border-border/80 bg-surface-elevated/20">
                <h3 className="text-base font-bold text-text mb-4 border-b border-border/40 pb-2">
                  Discussion Feed
                </h3>

                <div className="mb-6 bg-surface-elevated/40 border border-border/60 rounded-xl p-4">
                  <CommentForm
                    onSubmit={handleAddDiscussion}
                    loading={commentLoading}
                    showTypeSelector
                    placeholder="Ask a question or share details..."
                    submitLabel="Post Message"
                  />
                </div>

                {discussions.length > 0 ? (
                  <div className="divide-y divide-border/30">
                    {discussions.map((d) => (
                      <CommentThread
                        key={d.id}
                        discussion={d}
                        onAddReply={handleAddReply}
                        onDelete={handleDeleteDiscussion}
                        currentUserId={user?.id}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-text-secondary py-12 text-sm border border-dashed border-border rounded-lg">
                    No discussion threads yet. Post a comment to begin.
                  </div>
                )}
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="border border-border/80 bg-surface-elevated/20">
                <h3 className="text-sm font-bold text-text mb-3">Rationales & Notes</h3>
                <MeetingNotes discussions={discussions} />
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border border-border/80 bg-surface-elevated/20">
                <h3 className="text-base font-bold text-text mb-4 border-b border-border/40 pb-2">
                  Documents Attached
                </h3>
                <FileList files={files} onDelete={handleDeleteFile} canDelete={!!user} />
              </Card>
            </div>

            {user && (
              <div className="lg:col-span-4">
                <Card className="border border-border/80 bg-surface-elevated/20">
                  <h3 className="text-sm font-bold text-text mb-3">Upload Document</h3>
                  <FileUpload onUpload={handleFileUpload} loading={fileLoading} />
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <Card className="border border-border/80 bg-surface-elevated/20">
            <h3 className="text-base font-bold text-text mb-6 border-b border-border/40 pb-2">
              Decision Version History
            </h3>

            {history.length > 0 ? (
              <div className="relative border-l border-border pl-6 space-y-6 ml-3 py-2">
                {history.map((hist) => (
                  <div key={hist.id} className="relative animate-fadeIn">
                    <div className="absolute -left-[30px] top-1 h-2 w-2 rounded-full bg-primary" />
                    
                    <div className="space-y-1">
                      <div className="text-xs text-text-muted flex items-center gap-2">
                        <span className="font-bold text-text-secondary">
                          {hist.updater?.username}
                        </span>
                        <span>•</span>
                        <span>{hist.updated_at ? formatDate(hist.updated_at) : ''}</span>
                      </div>

                      {hist.changed_fields ? (
                        <div className="mt-2 text-xs bg-surface rounded-lg p-3.5 border border-border/40 space-y-2 max-w-2xl">
                          {Object.entries(hist.changed_fields).map(([field, delta]: [string, any]) => (
                            <div key={field} className="leading-relaxed">
                              <span className="font-semibold text-primary-light uppercase tracking-wider mr-2">
                                {field}:
                              </span>
                              {field === 'status' ? (
                                <span>
                                  Changed from <strong className="text-text-secondary">{delta.old}</strong> to{' '}
                                  <strong className="text-text">{delta.new}</strong>
                                </span>
                              ) : (
                                <div className="mt-1 pl-3.5 border-l border-border/60 text-text-secondary space-y-0.5">
                                  <div className="line-through text-error/70">Was: {delta.old}</div>
                                  <div className="text-success/90">Became: {delta.new}</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-text-secondary mt-1">
                          Created or initially updated decision details.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-text-secondary py-8 text-sm">
                No update history recorded yet. Edits will trigger history records.
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Edit Decision Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Decision Details"
      >
        <DecisionForm
          initialData={decision}
          onSubmit={handleUpdateDecision}
          loading={editLoading}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Alternative Form Modal */}
      <Modal
        isOpen={isAltModalOpen}
        onClose={() => {
          setIsAltModalOpen(false);
          setSelectedAlt(null);
        }}
        title={selectedAlt ? 'Edit Alternative Evaluation' : 'Add Alternative Evaluation'}
      >
        <AlternativeForm
          initialData={selectedAlt}
          onSubmit={handleAddAlternative}
          loading={altLoading}
          onCancel={() => {
            setIsAltModalOpen(false);
            setSelectedAlt(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default DecisionDetailPage;
