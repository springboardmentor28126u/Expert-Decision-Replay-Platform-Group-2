import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { ConfirmModal } from '../components/dashboard/ConfirmModal';
import { useToast } from '../hooks/use-toast';
import {
  approvalChainService,
  type ApprovalChainConfig,
  type ApprovalChainLevel,
} from '../services/approvalChainService';
import {
  routingRuleService,
  type RoutingRule,
  type CreateRoutingRulePayload,
} from '../services/routingRuleService';
import { categoryService } from '../services/categoryService';
import { groupService, type AdminGroupListItem } from '../services/groupService';
import type { DecisionCategory } from '../types/decision';
import {
  IconHome,
  IconPlus,
  IconUserCog,
  IconUsers,
  IconUsersGroup,
  IconGitBranch,
  IconArrowUp,
  IconArrowDown,
  IconTrash,
  IconPencil,
  IconClock,
  IconCheck,
  IconX,
  IconFilter,
  IconToggleLeft,
  IconToggleRight,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/admin' },
  { label: 'Users', icon: IconUserCog, path: '/dashboard/admin/users' },
  { label: 'Groups', icon: IconUsersGroup, path: '/dashboard/admin/groups' },
  { label: 'Approval Chains', icon: IconGitBranch, path: '/dashboard/admin/approval-chains' },
  { label: 'Requests', icon: IconUsers, path: '/dashboard/admin/requests' },
];

const AVAILABLE_ROLES = [
  { value: 'manager', label: 'Manager' },
  { label: 'Employee', value: 'employee' },
  { label: 'Admin', value: 'admin' },
];

const CONDITION_FIELDS = [
  { value: 'financial_impact', label: 'Financial Impact' },
  { value: 'risk_score', label: 'Risk Score' },
  { value: 'impact_level', label: 'Impact Level' },
];

const OPERATORS = [
  { value: 'gt', label: '> (greater than)' },
  { value: 'gte', label: '>= (greater or equal)' },
  { value: 'lt', label: '< (less than)' },
  { value: 'lte', label: '<= (less or equal)' },
  { value: 'eq', label: '= (equals)' },
  { value: 'in', label: 'in (comma-separated list)' },
];

const INSERT_POSITIONS = [
  { value: 'append', label: 'Append to end' },
  { value: 'insert_before', label: 'Insert before level' },
];

type ActiveTab = 'chains' | 'rules';

export default function AdminApprovalChains() {
  const { currentCompanyId } = useAuth();
  const { toast } = useToast();

  const [chains, setChains] = useState<ApprovalChainConfig[]>([]);
  const [categories, setCategories] = useState<DecisionCategory[]>([]);
  const [groups, setGroups] = useState<AdminGroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChainId, setEditingChainId] = useState<string | null>(null);

  // Form State
  const [categoryInput, setCategoryInput] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(''); // empty string = All Groups (null)
  const [levels, setLevels] = useState<ApprovalChainLevel[]>([
    { level: 1, role: 'manager' },
  ]);
  const [slaHours, setSlaHours] = useState<number>(24);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [_deleting, setDeleting] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('chains');

  // Routing Rules State
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleCategory, setRuleCategory] = useState('');
  const [ruleConditionField, setRuleConditionField] = useState('financial_impact');
  const [ruleOperator, setRuleOperator] = useState('gte');
  const [ruleConditionValue, setRuleConditionValue] = useState('');
  const [ruleInsertedRole, setRuleInsertedRole] = useState('manager');
  const [ruleInsertPosition, setRuleInsertPosition] = useState('append');
  const [ruleInsertBeforeLevel, setRuleInsertBeforeLevel] = useState<number>(2);
  const [rulePriority, setRulePriority] = useState(0);
  const [ruleActive, setRuleActive] = useState(true);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleFormError, setRuleFormError] = useState('');
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [_deletingRule, setDeletingRule] = useState(false);

  const loadData = async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError('');
    try {
      const [chainsData, categoriesData, groupsData] = await Promise.all([
        approvalChainService.list(currentCompanyId),
        categoryService.list().catch(() => []),
        groupService.adminGroups().catch(() => []),
      ]);
      setChains(chainsData);
      setCategories(categoriesData);
      setGroups(groupsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load approval chains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompanyId]);

  useEffect(() => {
    if (activeTab === 'rules' && currentCompanyId) {
      loadRules();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentCompanyId]);

  const loadRules = async () => {
    if (!currentCompanyId) return;
    setRulesLoading(true);
    try {
      const data = await routingRuleService.list(currentCompanyId);
      setRules(data);
    } catch (err: any) {
      console.error('Failed to load routing rules', err);
    } finally {
      setRulesLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingChainId(null);
    setCategoryInput(categories[0]?.name || 'Finance');
    setCustomCategory('');
    setIsCustomCat(false);
    setSelectedGroupId('');
    setLevels([
      { level: 1, role: 'manager' },
    ]);
    setSlaHours(24);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (chain: ApprovalChainConfig) => {
    setEditingChainId(chain.id);
    const matchedCat = categories.find((c) => c.name.toLowerCase() === chain.category.toLowerCase());
    if (matchedCat) {
      setCategoryInput(matchedCat.name);
      setIsCustomCat(false);
    } else {
      setCategoryInput('__custom__');
      setCustomCategory(chain.category);
      setIsCustomCat(true);
    }
    setSelectedGroupId(chain.group_id || '');
    setLevels(chain.levels.map((l, idx) => ({ level: idx + 1, role: l.role })));
    setSlaHours(chain.sla_hours || 24);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddLevel = () => {
    setLevels((prev) => [
      ...prev,
      { level: prev.length + 1, role: 'manager' },
    ]);
  };

  const handleRemoveLevel = (index: number) => {
    if (levels.length <= 1) return;
    setLevels((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      return updated.map((item, idx) => ({ ...item, level: idx + 1 }));
    });
  };

  const handleRoleChange = (index: number, role: string) => {
    setLevels((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, role } : item))
    );
  };

  const handleMoveLevel = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === levels.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setLevels((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next.map((item, idx) => ({ ...item, level: idx + 1 }));
    });
  };

  const handleSave = async () => {
    if (!currentCompanyId) return;
    const finalCategory = isCustomCat ? customCategory.trim() : categoryInput;
    if (!finalCategory) {
      setFormError('Category is required');
      return;
    }
    if (levels.length === 0) {
      setFormError('At least 1 level is required');
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      category: finalCategory,
      group_id: selectedGroupId || null,
      levels,
      sla_hours: slaHours,
    };

    try {
      if (editingChainId) {
        await approvalChainService.update(currentCompanyId, editingChainId, payload);
        toast({ title: 'Approval chain updated successfully' });
      } else {
        await approvalChainService.create(currentCompanyId, payload);
        toast({ title: 'Approval chain created successfully' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || d.message).join('; ')
          : 'Failed to save approval chain';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId || !currentCompanyId) return;
    setDeleting(true);
    try {
      await approvalChainService.delete(currentCompanyId, deleteTargetId);
      toast({ title: 'Approval chain deleted successfully' });
      setDeleteTargetId(null);
      loadData();
    } catch (err: any) {
      toast({
        title: 'Error deleting approval chain',
        description: err.response?.data?.detail || 'Failed to delete approval chain',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // ─── Routing Rules Handlers ──────────────────────────────────────────

  const openCreateRuleModal = () => {
    setEditingRuleId(null);
    setRuleCategory(categories[0]?.name || 'Finance');
    setRuleConditionField('financial_impact');
    setRuleOperator('gte');
    setRuleConditionValue('');
    setRuleInsertedRole('manager');
    setRuleInsertPosition('append');
    setRuleInsertBeforeLevel(2);
    setRulePriority(0);
    setRuleActive(true);
    setRuleFormError('');
    setRuleModalOpen(true);
  };

  const openEditRuleModal = (rule: RoutingRule) => {
    setEditingRuleId(rule.id);
    setRuleCategory(rule.category);
    setRuleConditionField(rule.condition_field);
    setRuleOperator(rule.operator);
    setRuleConditionValue(rule.condition_value);
    setRuleInsertedRole(rule.inserted_role);
    setRuleInsertPosition(rule.insert_position);
    setRuleInsertBeforeLevel(rule.insert_before_level || 2);
    setRulePriority(rule.priority);
    setRuleActive(rule.active);
    setRuleFormError('');
    setRuleModalOpen(true);
  };

  const handleSaveRule = async () => {
    if (!currentCompanyId) return;
    if (!ruleCategory.trim()) {
      setRuleFormError('Category is required');
      return;
    }
    if (!ruleConditionValue.trim()) {
      setRuleFormError('Condition value is required');
      return;
    }

    setRuleSaving(true);
    setRuleFormError('');

    const payload: CreateRoutingRulePayload = {
      category: ruleCategory.trim(),
      condition_field: ruleConditionField,
      operator: ruleOperator,
      condition_value: ruleConditionValue.trim(),
      inserted_role: ruleInsertedRole,
      insert_position: ruleInsertPosition,
      insert_before_level: ruleInsertPosition === 'insert_before' ? ruleInsertBeforeLevel : null,
      priority: rulePriority,
      active: ruleActive,
    };

    try {
      if (editingRuleId) {
        await routingRuleService.update(currentCompanyId, editingRuleId, payload);
        toast({ title: 'Routing rule updated successfully' });
      } else {
        await routingRuleService.create(currentCompanyId, payload);
        toast({ title: 'Routing rule created successfully' });
      }
      setRuleModalOpen(false);
      loadRules();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || d.message).join('; ')
          : 'Failed to save routing rule';
      setRuleFormError(message);
    } finally {
      setRuleSaving(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleId || !currentCompanyId) return;
    setDeletingRule(true);
    try {
      await routingRuleService.delete(currentCompanyId, deleteRuleId);
      toast({ title: 'Routing rule deleted successfully' });
      setDeleteRuleId(null);
      loadRules();
    } catch (err: any) {
      toast({
        title: 'Error deleting routing rule',
        description: err.response?.data?.detail || 'Failed to delete routing rule',
        variant: 'destructive',
      });
    } finally {
      setDeletingRule(false);
    }
  };

  const renderLevelsChain = (chainLevels: ApprovalChainLevel[]) => {
    if (!chainLevels || chainLevels.length === 0) return <span className="text-gray-400">None</span>;
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {chainLevels.map((lvl, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <span className="text-indigo-400 dark:text-indigo-500 font-mono text-[10px]">L{lvl.level}</span>
              <span className="capitalize">{lvl.role}</span>
            </span>
            {idx < chainLevels.length - 1 && (
              <span className="text-gray-400 font-bold text-xs">→</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <IconGitBranch className="text-indigo-600 dark:text-indigo-400" size={26} />
              Approval Configuration
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure approval chains and conditional routing rules for your organization.
            </p>
          </div>
          <button
            onClick={activeTab === 'chains' ? openCreateModal : openCreateRuleModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
          >
            <IconPlus size={18} />
            {activeTab === 'chains' ? 'New Approval Chain' : 'New Routing Rule'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('chains')}
              className={`inline-flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'chains'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <IconGitBranch size={16} />
              Approval Chains
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`inline-flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rules'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <IconFilter size={16} />
              Routing Rules
            </button>
          </nav>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* ─── Chains Tab ──────────────────────────────────────────────── */}
        {activeTab === 'chains' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                <p className="mt-2 text-sm font-medium">Loading approval chains...</p>
              </div>
            ) : chains.length === 0 ? (
              <div className="p-12 text-center">
                <IconGitBranch size={40} className="mx-auto text-gray-400 mb-3" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Approval Chains Configured</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                  Create an approval chain config for specific categories or groups to define decision approval workflows.
                </p>
                <button
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  <IconPlus size={16} />
                  Create First Chain
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Group Scope</th>
                      <th className="px-6 py-3.5">Approval Levels</th>
                      <th className="px-6 py-3.5">SLA</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {chains.map((chain) => (
                      <tr key={chain.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                          <span className="inline-flex items-center gap-1.5">
                            {chain.category === 'default' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                Default (Fallback)
                              </span>
                            ) : (
                              chain.category
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {chain.group_name ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
                              <IconUsersGroup size={14} className="text-gray-500" />
                              {chain.group_name}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 italic">
                              All Groups (Company-wide)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {renderLevelsChain(chain.levels)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          <span className="inline-flex items-center gap-1 text-xs font-medium">
                            <IconClock size={14} className="text-gray-400" />
                            {chain.sla_hours ? `${chain.sla_hours}h` : 'No SLA'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(chain)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            title="Edit Chain"
                          >
                            <IconPencil size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(chain.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            title="Delete Chain"
                          >
                            <IconTrash size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── Routing Rules Tab ────────────────────────────────────────── */}
        {activeTab === 'rules' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            {rulesLoading ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                <p className="mt-2 text-sm font-medium">Loading routing rules...</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="p-12 text-center">
                <IconFilter size={40} className="mx-auto text-gray-400 mb-3" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Routing Rules Configured</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                  Routing rules dynamically modify approval chains based on decision attributes like financial impact or risk score.
                </p>
                <button
                  onClick={openCreateRuleModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  <IconPlus size={16} />
                  Create First Rule
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Condition</th>
                      <th className="px-6 py-3.5">Insert Role</th>
                      <th className="px-6 py-3.5">Position</th>
                      <th className="px-6 py-3.5">Priority</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                          {rule.category}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          <span className="inline-flex items-center gap-1 text-xs font-mono">
                            <span className="text-indigo-600 dark:text-indigo-400">{rule.condition_field}</span>
                            <span className="text-gray-400">{rule.operator}</span>
                            <span className="text-gray-900 dark:text-white font-semibold">{rule.condition_value}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 capitalize">
                            {rule.inserted_role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">
                          {rule.insert_position === 'append' ? (
                            'Append'
                          ) : (
                            <span>Before L{rule.insert_before_level}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs font-mono">
                          {rule.priority}
                        </td>
                        <td className="px-6 py-4">
                          {rule.active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                              <IconToggleRight size={16} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                              <IconToggleLeft size={16} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditRuleModal(rule)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            title="Edit Rule"
                          >
                            <IconPencil size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteRuleId(rule.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            title="Delete Rule"
                          >
                            <IconTrash size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingChainId ? 'Edit Approval Chain' : 'Configure New Approval Chain'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <IconX size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            {/* Category Dropdown/Custom */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Category
              </label>
              <select
                value={isCustomCat ? '__custom__' : categoryInput}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomCat(true);
                  } else {
                    setIsCustomCat(false);
                    setCategoryInput(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="default">default (Fallback for unconfigured categories)</option>
                <option value="__custom__">+ Add Custom Category...</option>
              </select>

              {isCustomCat && (
                <input
                  type="text"
                  placeholder="Enter category name (e.g. Security)"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            {/* Group Scope */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Group Scope (Optional)
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Groups in this Company (Company-wide default)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    Group: {g.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                A group-specific chain overrides the company-wide default for that category.
              </p>
            </div>

            {/* Level Builder */}
            <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Ordered Approval Levels
                </label>
                <button
                  type="button"
                  onClick={handleAddLevel}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <IconPlus size={14} /> Add Level
                </button>
              </div>

              <div className="space-y-2">
                {levels.map((lvl, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-mono text-xs font-bold">
                      {index + 1}
                    </span>

                    <select
                      value={lvl.role}
                      onChange={(e) => handleRoleChange(index, e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
                    >
                      {AVAILABLE_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveLevel(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30"
                        title="Move Up"
                      >
                        <IconArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveLevel(index, 'down')}
                        disabled={index === levels.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30"
                        title="Move Down"
                      >
                        <IconArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveLevel(index)}
                        disabled={levels.length <= 1}
                        className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30"
                        title="Remove Level"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SLA Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                SLA Hours
              </label>
              <input
                type="number"
                min={1}
                value={slaHours}
                onChange={(e) => setSlaHours(parseInt(e.target.value, 10) || 24)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <IconCheck size={16} />
                )}
                Save Chain Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTargetId}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Approval Chain"
        message="Are you sure you want to delete this approval chain configuration? Submissions for this category will fall back to company defaults or be blocked if no fallback exists."
        confirmLabel="Delete Chain"
        variant="danger"
      />

      {/* ─── Routing Rule Create/Edit Modal ──────────────────────────── */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingRuleId ? 'Edit Routing Rule' : 'Create Routing Rule'}
              </h3>
              <button
                onClick={() => setRuleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <IconX size={20} />
              </button>
            </div>

            {ruleFormError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                {ruleFormError}
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Category
              </label>
              <select
                value={ruleCategory}
                onChange={(e) => setRuleCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="default">default</option>
              </select>
            </div>

            {/* Condition Field + Operator */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Condition Field
                </label>
                <select
                  value={ruleConditionField}
                  onChange={(e) => setRuleConditionField(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CONDITION_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Operator
                </label>
                <select
                  value={ruleOperator}
                  onChange={(e) => setRuleOperator(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {OPERATORS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condition Value */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Condition Value
              </label>
              <input
                type="text"
                placeholder={ruleConditionField === 'financial_impact' ? 'e.g. 50000' : ruleConditionField === 'risk_score' ? 'e.g. 7' : 'e.g. critical'}
                value={ruleConditionValue}
                onChange={(e) => setRuleConditionValue(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Inserted Role + Position */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Insert Role
                </label>
                <select
                  value={ruleInsertedRole}
                  onChange={(e) => setRuleInsertedRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Insert Position
                </label>
                <select
                  value={ruleInsertPosition}
                  onChange={(e) => setRuleInsertPosition(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {INSERT_POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Insert Before Level (conditional) */}
            {ruleInsertPosition === 'insert_before' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Insert Before Level
                </label>
                <input
                  type="number"
                  min={1}
                  value={ruleInsertBeforeLevel}
                  onChange={(e) => setRuleInsertBeforeLevel(parseInt(e.target.value, 10) || 2)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Priority + Active */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Priority (lower = higher priority)
                </label>
                <input
                  type="number"
                  min={0}
                  value={rulePriority}
                  onChange={(e) => setRulePriority(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => setRuleActive(!ruleActive)}
                  className={`w-full inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition ${
                    ruleActive
                      ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {ruleActive ? <IconToggleRight size={18} /> : <IconToggleLeft size={18} />}
                  {ruleActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
              <button
                type="button"
                onClick={() => setRuleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                disabled={ruleSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {ruleSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <IconCheck size={16} />
                )}
                {editingRuleId ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Routing Rule Delete Confirmation */}
      <ConfirmModal
        open={!!deleteRuleId}
        onCancel={() => setDeleteRuleId(null)}
        onConfirm={handleDeleteRule}
        title="Delete Routing Rule"
        message="Are you sure you want to delete this routing rule? It will no longer modify approval chains for matching decisions."
        confirmLabel="Delete Rule"
        variant="danger"
      />
    </DashboardLayout>
  );
}
