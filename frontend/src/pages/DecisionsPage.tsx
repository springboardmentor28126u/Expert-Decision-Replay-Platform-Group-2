import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { decisionsApi } from '../api/decisions';
import { DecisionListResponse, DecisionStatus } from '../types';
import DecisionCard from '../components/decisions/DecisionCard';
import DecisionForm from '../components/decisions/DecisionForm';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DECISION_STATUSES } from '../utils/constants';

const DecisionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [data, setData] = useState<DecisionListResponse | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsModalOpen(true);
      searchParams.delete('create');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const response = await decisionsApi.list({
        status: status ? (status as DecisionStatus) : undefined,
        category: category || undefined,
        search: search || undefined,
      });
      setData(response);
    } catch (error) {
      console.error('Failed to load decisions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, [status, category]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await decisionsApi.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories list', err);
      }
    };
    fetchCats();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDecisions();
  };

  const handleCreateDecision = async (formData: any) => {
    setFormLoading(true);
    try {
      await decisionsApi.create(formData);
      setIsModalOpen(false);
      fetchDecisions();
    } catch (error) {
      console.error('Failed to create decision', error);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="section-spacing">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-text">Decisions Library</h1>
          <p className="text-sm text-text-secondary">
            Search, filter, and review recorded organizational decisions.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          New Decision
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="glass-card p-6 flex flex-col md:flex-row gap-4 items-end bg-surface-elevated/40"
      >
        <div className="flex-1 w-full">
          <Input
            label="Search Keywords"
            placeholder="Search by keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full md:w-48 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-field"
          >
            <option value="">All Statuses</option>
            {DECISION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" variant="secondary" className="w-full md:w-auto h-10 shrink-0">
          Search
        </Button>
      </form>

      {/* Grid List */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((d) => (
            <DecisionCard key={d.id} decision={d} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-text-secondary">
          No decisions match your search parameters. Try adjusting the filters.
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Decision"
      >
        <DecisionForm
          onSubmit={handleCreateDecision}
          loading={formLoading}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default DecisionsPage;
