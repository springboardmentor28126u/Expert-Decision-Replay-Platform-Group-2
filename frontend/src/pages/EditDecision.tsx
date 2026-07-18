import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { decisionService } from '../services/decisionService';
import { alternativeService } from '../services/alternativeService';
import { categoryService } from '../services/categoryService';
import type {
  Decision,
  DecisionCategory,
  DecisionUpdatePayload,
  AlternativeCreatePayload,
} from '../types/decision';
import {
  IconArrowLeft,
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
  IconDeviceFloppy,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/employee' },
  { label: 'My Decisions', icon: IconFileText, path: '/decisions' },
  { label: 'Discussions', icon: IconMessageCircle, path: '/dashboard/employee/discussions' },
  { label: 'Profile', icon: IconUser, path: '/dashboard/employee/profile' },
];

interface AltForm {
  _key: string;
  _id?: string;
  _saved: boolean;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  estimated_cost: number | null;
  feasibility_score: number | null;
  risk_level: string;
  is_recommended: boolean;
}

export default function EditDecision() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<DecisionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Decision fields
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [impactLevel, setImpactLevel] = useState('medium');
  const [targetDate, setTargetDate] = useState('');
  const [decision, setDecision] = useState<Decision | null>(null);

  // Alternatives
  const [alternatives, setAlternatives] = useState<AltForm[]>([]);
  const [savingAlt, setSavingAlt] = useState<string | null>(null);

  useEffect(() => {
    categoryService.list().then(setCategories).catch(console.error);
    if (id) loadDecision();
  }, [id]);

  const loadDecision = async () => {
    setLoading(true);
    try {
      const data = await decisionService.get(id!);
      if (data.status !== 'draft') {
        setError('Only draft decisions can be edited.');
        setLoading(false);
        return;
      }
      setDecision(data);
      setTitle(data.title);
      setProblemStatement(data.problem_statement);
      setCategoryId(data.category_id);
      setImpactLevel(data.impact_level);
      setTargetDate(data.target_date || '');

      // Load alternatives
      setAlternatives(
        (data.alternatives || []).map((alt) => ({
          _key: alt.id,
          _id: alt.id,
          _saved: true,
          title: alt.title,
          description: alt.description || '',
          pros: alt.pros.length > 0 ? alt.pros : [''],
          cons: alt.cons.length > 0 ? alt.cons : [''],
          estimated_cost: alt.estimated_cost != null ? Number(alt.estimated_cost) : null,
          feasibility_score: alt.feasibility_score,
          risk_level: alt.risk_level,
          is_recommended: alt.is_recommended,
        }))
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load decision');
    }
    setLoading(false);
  };

  const handleSaveBasicInfo = async () => {
    if (!id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: DecisionUpdatePayload = {
        title,
        problem_statement: problemStatement,
        category_id: categoryId,
        impact_level: impactLevel as any,
        target_date: targetDate || undefined,
      };
      const updated = await decisionService.update(id, payload);
      setDecision(updated);
      setSuccess('Decision updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update');
    }
    setSaving(false);
  };

  // Alternative helpers (similar to CreateDecision)
  const addAlternative = () => {
    setAlternatives(prev => [
      ...prev,
      {
        _key: Date.now().toString(),
        _saved: false,
        title: '',
        description: '',
        pros: [''],
        cons: [''],
        estimated_cost: null,
        feasibility_score: 5,
        risk_level: 'medium',
        is_recommended: false,
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
      prev.map(a => a._key === key ? { ...a, [field]: [...a[field], ''], _saved: false } : a)
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
      prev.map(a => a._key === key ? { ...a, [field]: a[field].filter((_, i) => i !== idx), _saved: false } : a)
    );
  };

  const saveAlternative = async (alt: AltForm) => {
    if (!id) return;
    setSavingAlt(alt._key);
    setError('');
    try {
      const payload: AlternativeCreatePayload = {
        title: alt.title,
        description: alt.description || undefined,
        pros: alt.pros.filter(p => p.trim()),
        cons: alt.cons.filter(c => c.trim()),
        estimated_cost: alt.estimated_cost,
        feasibility_score: alt.feasibility_score,
        risk_level: alt.risk_level as any,
        is_recommended: alt.is_recommended,
      };
      if (alt._id) {
        await alternativeService.update(id, alt._id, payload);
        setAlternatives(prev =>
          prev.map(a => a._key === alt._key ? { ...a, _saved: true } : a)
        );
      } else {
        const created = await alternativeService.create(id, payload);
        setAlternatives(prev =>
          prev.map(a => a._key === alt._key ? { ...a, _id: created.id, _saved: true } : a)
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save alternative');
    }
    setSavingAlt(null);
  };

  const deleteAlternative = async (alt: AltForm) => {
    if (alt._id && id) {
      try {
        await alternativeService.delete(id, alt._id);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to delete');
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

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/decisions/${id}`)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <IconArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Decision</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Editing draft: {decision?.title}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <IconAlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
            <IconCheck size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Basic Info */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Select category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Problem Statement</label>
            <textarea
              rows={4}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Impact Level</label>
              <select
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveBasicInfo}
              disabled={saving || title.length < 3 || problemStatement.length < 10 || !categoryId}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <IconDeviceFloppy size={16} />
              )}
              Save Changes
            </button>
          </div>
        </div>

        {/* Alternatives */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Alternatives ({alternatives.length})
            </h2>
            <button
              onClick={addAlternative}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
            >
              <IconPlus size={16} /> Add Alternative
            </button>
          </div>

          {alternatives.map((alt) => (
            <div
              key={alt._key}
              className={`rounded-2xl border bg-white dark:bg-gray-900/80 p-5 space-y-4 transition-colors ${alt._saved ? 'border-green-200 dark:border-green-800/40' : 'border-gray-200 dark:border-gray-800/60'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <button onClick={() => toggleRecommended(alt._key)} className={`p-1 rounded-lg ${alt.is_recommended ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'}`}>
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
                  {alt._saved && <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">Saved</span>}
                  <button onClick={() => deleteAlternative(alt)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>

              <textarea
                value={alt.description}
                onChange={(e) => updateAlternative(alt._key, 'description', e.target.value)}
                placeholder="Describe this alternative..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-green-700 dark:text-green-400 mb-1.5 uppercase tracking-wide">Pros</label>
                  {alt.pros.map((pro, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-green-500 text-sm">+</span>
                      <input type="text" value={pro} onChange={(e) => updateListItem(alt._key, 'pros', idx, e.target.value)} placeholder="Add a pro..." className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-green-500/30 text-gray-900 dark:text-white" />
                      <button onClick={() => removeListItem(alt._key, 'pros', idx)} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                    </div>
                  ))}
                  <button onClick={() => addListItem(alt._key, 'pros')} className="text-xs text-green-600 hover:underline mt-0.5">+ Add pro</button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5 uppercase tracking-wide">Cons</label>
                  {alt.cons.map((con, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-red-500 text-sm">−</span>
                      <input type="text" value={con} onChange={(e) => updateListItem(alt._key, 'cons', idx, e.target.value)} placeholder="Add a con..." className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 text-gray-900 dark:text-white" />
                      <button onClick={() => removeListItem(alt._key, 'cons', idx)} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                    </div>
                  ))}
                  <button onClick={() => addListItem(alt._key, 'cons')} className="text-xs text-red-600 hover:underline mt-0.5">+ Add con</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cost (₹)</label>
                  <input type="number" value={alt.estimated_cost ?? ''} onChange={(e) => updateAlternative(alt._key, 'estimated_cost', e.target.value ? Number(e.target.value) : null)} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Feasibility (1–10)</label>
                  <input type="number" min={1} max={10} value={alt.feasibility_score ?? ''} onChange={(e) => updateAlternative(alt._key, 'feasibility_score', e.target.value ? Number(e.target.value) : null)} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Risk Level</label>
                  <select value={alt.risk_level} onChange={(e) => updateAlternative(alt._key, 'risk_level', e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-gray-900 dark:text-white">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {savingAlt === alt._key ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <IconCheck size={16} />}
                  {alt._id ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => navigate(`/decisions/${id}`)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20"
          >
            Done Editing
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
