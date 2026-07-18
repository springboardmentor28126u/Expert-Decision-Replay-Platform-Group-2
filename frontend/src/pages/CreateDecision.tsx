import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { decisionService } from '../services/decisionService';
import { alternativeService } from '../services/alternativeService';
import { categoryService } from '../services/categoryService';
import type {
  DecisionCategory,
  DecisionCreatePayload,
  AlternativeCreatePayload,
  Alternative,
} from '../types/decision';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconPlus,
  IconTrash,
  IconHome,
  IconFileText,
  IconMessageCircle,
  IconUser,
  IconAlertCircle,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/employee' },
  { label: 'My Decisions', icon: IconFileText, path: '/decisions' },
  { label: 'Discussions', icon: IconMessageCircle, path: '/dashboard/employee/discussions' },
  { label: 'Profile', icon: IconUser, path: '/dashboard/employee/profile' },
];

const steps = ['Basic Info', 'Alternatives', 'Review & Submit'];

interface AlternativeForm extends AlternativeCreatePayload {
  _key: string; // local identifier before saving
  _saved?: boolean;
  _id?: string; // server ID after saving
}

export default function CreateDecision() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<DecisionCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [decisionId, setDecisionId] = useState<string | null>(null);

  // Step 1 — Basic Info
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [impactLevel, setImpactLevel] = useState('medium');
  const [targetDate, setTargetDate] = useState('');

  // Step 2 — Alternatives
  const [alternatives, setAlternatives] = useState<AlternativeForm[]>([]);
  const [savingAlt, setSavingAlt] = useState<string | null>(null);

  useEffect(() => {
    categoryService.list().then(setCategories).catch(console.error);
  }, []);

  // ─── Step navigation ──────────────────────────────────────
  const canProceedStep1 = title.length >= 3 && problemStatement.length >= 10 && categoryId;
  const canProceedStep2 = alternatives.length >= 1 && alternatives.some(a => a.is_recommended) && alternatives.every(a => a._saved);

  const handleNext = async () => {
    setError('');
    if (currentStep === 0) {
      // Save the decision (create draft)
      if (!decisionId) {
        setSaving(true);
        try {
          const payload: DecisionCreatePayload = {
            title,
            problem_statement: problemStatement,
            category_id: categoryId,
            impact_level: impactLevel as any,
            target_date: targetDate || null,
          };
          const decision = await decisionService.create(payload);
          setDecisionId(decision.id);
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Failed to create decision');
          setSaving(false);
          return;
        }
        setSaving(false);
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Validate alternatives
      const unsaved = alternatives.filter(a => !a._saved);
      if (unsaved.length > 0) {
        setError('Please save all alternatives before proceeding.');
        return;
      }
      if (alternatives.length < 1) {
        setError('At least one alternative is required.');
        return;
      }
      if (!alternatives.some(a => a.is_recommended)) {
        setError('At least one alternative must be marked as recommended.');
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  // ─── Alternative management ──────────────────────────────
  const addAlternative = () => {
    setAlternatives([
      ...alternatives,
      {
        _key: Date.now().toString(),
        title: '',
        description: '',
        pros: [''],
        cons: [''],
        estimated_cost: null,
        feasibility_score: 5,
        risk_level: 'medium',
        is_recommended: false,
        _saved: false,
      },
    ]);
  };

  const updateAlternative = (key: string, field: string, value: any) => {
    setAlternatives(prev =>
      prev.map(a => a._key === key ? { ...a, [field]: value, _saved: false } : a)
    );
  };

  const addListItem = (key: string, field: 'pros' | 'cons') => {
    setAlternatives(prev =>
      prev.map(a =>
        a._key === key ? { ...a, [field]: [...a[field], ''], _saved: false } : a
      )
    );
  };

  const updateListItem = (key: string, field: 'pros' | 'cons', idx: number, value: string) => {
    setAlternatives(prev =>
      prev.map(a =>
        a._key === key
          ? { ...a, [field]: a[field].map((item, i) => (i === idx ? value : item)), _saved: false }
          : a
      )
    );
  };

  const removeListItem = (key: string, field: 'pros' | 'cons', idx: number) => {
    setAlternatives(prev =>
      prev.map(a =>
        a._key === key ? { ...a, [field]: a[field].filter((_, i) => i !== idx), _saved: false } : a
      )
    );
  };

  const saveAlternative = async (alt: AlternativeForm) => {
    if (!decisionId) return;
    setSavingAlt(alt._key);
    try {
      const payload: AlternativeCreatePayload = {
        title: alt.title,
        description: alt.description || undefined,
        pros: alt.pros.filter(p => p.trim()),
        cons: alt.cons.filter(c => c.trim()),
        estimated_cost: alt.estimated_cost,
        feasibility_score: alt.feasibility_score,
        risk_level: alt.risk_level,
        is_recommended: alt.is_recommended,
      };
      if (alt._id) {
        // Update existing
        await alternativeService.update(decisionId, alt._id, payload);
        setAlternatives(prev =>
          prev.map(a => a._key === alt._key ? { ...a, _saved: true } : a)
        );
      } else {
        // Create new
        const created = await alternativeService.create(decisionId, payload);
        setAlternatives(prev =>
          prev.map(a => a._key === alt._key ? { ...a, _id: created.id, _saved: true } : a)
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save alternative');
    }
    setSavingAlt(null);
  };

  const deleteAlternative = async (alt: AlternativeForm) => {
    if (alt._id && decisionId) {
      try {
        await alternativeService.delete(decisionId, alt._id);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to delete alternative');
        return;
      }
    }
    setAlternatives(prev => prev.filter(a => a._key !== alt._key));
  };

  const toggleRecommended = (key: string) => {
    setAlternatives(prev =>
      prev.map(a => a._key === key ? { ...a, is_recommended: !a.is_recommended, _saved: false } : a)
    );
  };

  // ─── Submit ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!decisionId) return;
    setSubmitting(true);
    setError('');
    try {
      await decisionService.submit(decisionId);
      navigate(`/decisions/${decisionId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit decision');
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (decisionId) {
      navigate(`/decisions/${decisionId}`);
    } else {
      navigate('/decisions');
    }
  };

  // ─── Render helpers ───────────────────────────────────────
  const getCategoryName = () => categories.find(c => c.id === categoryId)?.name || '—';

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/decisions')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <IconArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Decision</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fill in the details to create a new decision record.
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold transition-colors ${idx < currentStep
                    ? 'bg-green-500 text-white'
                    : idx === currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
              >
                {idx < currentStep ? <IconCheck size={16} /> : idx + 1}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${idx === currentStep
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                {step}
              </span>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${idx < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <IconAlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1 — Basic Info */}
        {currentStep === 0 && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>

            <div>
              <label htmlFor="decision-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="decision-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q3 Budget Allocation"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="problem-statement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Problem Statement <span className="text-red-500">*</span>
              </label>
              <textarea
                id="problem-statement"
                rows={4}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Describe the problem or opportunity that requires a decision..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="impact-level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Impact Level
                </label>
                <select
                  id="impact-level"
                  value={impactLevel}
                  onChange={(e) => setImpactLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="target-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Target Decision Date
                </label>
                <input
                  id="target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Alternatives */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Alternatives ({alternatives.length})
              </h2>
              <button
                onClick={addAlternative}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <IconPlus size={16} /> Add Alternative
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add at least one alternative and mark at least one as recommended (★). Save each alternative before proceeding.
            </p>

            {alternatives.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No alternatives yet</p>
                <button
                  onClick={addAlternative}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                  <IconPlus size={16} /> Add First Alternative
                </button>
              </div>
            )}

            {alternatives.map((alt) => (
              <div
                key={alt._key}
                className={`rounded-2xl border bg-white dark:bg-gray-900/80 p-5 space-y-4 transition-colors ${alt._saved
                    ? 'border-green-200 dark:border-green-800/40'
                    : 'border-gray-200 dark:border-gray-800/60'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRecommended(alt._key)}
                      className={`p-1 rounded-lg transition-colors ${alt.is_recommended
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'
                        }`}
                      title={alt.is_recommended ? 'Recommended' : 'Mark as recommended'}
                    >
                      {alt.is_recommended ? <IconStarFilled size={20} /> : <IconStar size={20} />}
                    </button>
                    <input
                      type="text"
                      value={alt.title}
                      onChange={(e) => updateAlternative(alt._key, 'title', e.target.value)}
                      placeholder="Alternative title"
                      className="text-base font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder:text-gray-400 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {alt._saved && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                        Saved
                      </span>
                    )}
                    <button
                      onClick={() => deleteAlternative(alt)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>

                <textarea
                  value={alt.description || ''}
                  onChange={(e) => updateAlternative(alt._key, 'description', e.target.value)}
                  placeholder="Describe this alternative..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pros */}
                  <div>
                    <label className="block text-xs font-semibold text-green-700 dark:text-green-400 mb-1.5 uppercase tracking-wide">
                      Pros
                    </label>
                    {alt.pros.map((pro, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-green-500 text-sm">+</span>
                        <input
                          type="text"
                          value={pro}
                          onChange={(e) => updateListItem(alt._key, 'pros', idx, e.target.value)}
                          placeholder="Add a pro..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500/30"
                        />
                        <button
                          onClick={() => removeListItem(alt._key, 'pros', idx)}
                          className="text-gray-400 hover:text-red-500 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addListItem(alt._key, 'pros')}
                      className="text-xs text-green-600 dark:text-green-400 hover:underline mt-0.5"
                    >
                      + Add pro
                    </button>
                  </div>

                  {/* Cons */}
                  <div>
                    <label className="block text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5 uppercase tracking-wide">
                      Cons
                    </label>
                    {alt.cons.map((con, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-red-500 text-sm">−</span>
                        <input
                          type="text"
                          value={con}
                          onChange={(e) => updateListItem(alt._key, 'cons', idx, e.target.value)}
                          placeholder="Add a con..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                        />
                        <button
                          onClick={() => removeListItem(alt._key, 'cons', idx)}
                          className="text-gray-400 hover:text-red-500 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addListItem(alt._key, 'cons')}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline mt-0.5"
                    >
                      + Add con
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Cost (₹)
                    </label>
                    <input
                      type="number"
                      value={alt.estimated_cost ?? ''}
                      onChange={(e) =>
                        updateAlternative(alt._key, 'estimated_cost', e.target.value ? Number(e.target.value) : null)
                      }
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Feasibility (1–10)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={alt.feasibility_score ?? ''}
                      onChange={(e) =>
                        updateAlternative(alt._key, 'feasibility_score', e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Risk Level
                    </label>
                    <select
                      value={alt.risk_level}
                      onChange={(e) => updateAlternative(alt._key, 'risk_level', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => saveAlternative(alt)}
                    disabled={!alt.title || savingAlt === alt._key}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                  >
                    {savingAlt === alt._key ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <IconCheck size={16} />
                    )}
                    {alt._id ? 'Update' : 'Save'} Alternative
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3 — Review & Submit */}
        {currentStep === 2 && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review & Submit</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Title</p>
                  <p className="font-medium text-gray-900 dark:text-white">{title}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium text-gray-900 dark:text-white">{getCategoryName()}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Impact Level</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{impactLevel}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Target Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{targetDate || 'Not set'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Problem Statement</p>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{problemStatement}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Alternatives ({alternatives.length})
                </p>
                <div className="space-y-3">
                  {alternatives.map((alt) => (
                    <div
                      key={alt._key}
                      className={`p-4 rounded-xl border ${alt.is_recommended
                          ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10'
                          : 'border-gray-200 dark:border-gray-700'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {alt.is_recommended && <IconStarFilled size={16} className="text-amber-500" />}
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{alt.title}</p>
                      </div>
                      {alt.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{alt.description}</p>
                      )}
                      <div className="flex gap-6 text-xs text-gray-500 dark:text-gray-400">
                        <span>Pros: {alt.pros.filter(p => p.trim()).length}</span>
                        <span>Cons: {alt.cons.filter(c => c.trim()).length}</span>
                        {alt.estimated_cost != null && <span>Cost: ₹{alt.estimated_cost.toLocaleString()}</span>}
                        {alt.feasibility_score != null && <span>Feasibility: {alt.feasibility_score}/10</span>}
                        <span className="capitalize">Risk: {alt.risk_level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer — Navigation */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <IconArrowLeft size={16} /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Save Draft & Exit
            </button>
            {currentStep < 2 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 0 && !canProceedStep1) ||
                  (currentStep === 1 && !canProceedStep2) ||
                  saving
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>Next <IconArrowRight size={16} /></>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm shadow-green-600/20"
              >
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <IconCheck size={16} /> Submit for Review
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
