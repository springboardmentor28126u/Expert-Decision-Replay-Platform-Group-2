import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { Decision, DecisionCreate, DecisionUpdate } from '../../types';

interface DecisionFormProps {
  initialData?: Decision | null;
  onSubmit: (data: DecisionCreate | DecisionUpdate) => Promise<void>;
  loading: boolean;
  onCancel: () => void;
}

const DecisionForm: React.FC<DecisionFormProps> = ({
  initialData,
  onSubmit,
  loading,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { title?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Decision Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setErrors({});
        }}
        error={errors.title}
        placeholder="Enter a descriptive title"
        required
      />

      <div className="w-full">
        <label className="mb-1.5 block text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Description
        </label>
        <textarea
          className="input-field min-h-[120px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain the background, options, and reasons for this decision..."
        />
      </div>

      <Input
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="e.g. Architecture, HR, Security"
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {initialData ? 'Save Changes' : 'Create Decision'}
        </Button>
      </div>
    </form>
  );
};

export default DecisionForm;
