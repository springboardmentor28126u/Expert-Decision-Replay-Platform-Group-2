import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { Alternative, AlternativeCreate, AlternativeUpdate } from '../../types';

interface AlternativeFormProps {
  initialData?: Alternative | null;
  onSubmit: (data: AlternativeCreate | AlternativeUpdate) => Promise<void>;
  loading: boolean;
  onCancel: () => void;
}

const AlternativeForm: React.FC<AlternativeFormProps> = ({
  initialData,
  onSubmit,
  loading,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [cost, setCost] = useState(5);
  const [quality, setQuality] = useState(5);
  const [risk, setRisk] = useState(5);
  const [feasibility, setFeasibility] = useState(5);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPros(initialData.pros || '');
      setCons(initialData.cons || '');
      setCost(initialData.cost !== null ? initialData.cost : 5);
      setQuality(initialData.quality !== null ? initialData.quality : 5);
      setRisk(initialData.risk !== null ? initialData.risk : 5);
      setFeasibility(initialData.feasibility !== null ? initialData.feasibility : 5);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Alternative name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      pros: pros.trim() || undefined,
      cons: cons.trim() || undefined,
      cost,
      quality,
      risk,
      feasibility,
    });
  };

  const renderSlider = (
    label: string,
    value: number,
    onChange: (val: number) => void,
    lowLabel: string,
    highLabel: string
  ) => {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-semibold text-text-secondary uppercase">
          <span>{label}</span>
          <span className="text-primary-light font-bold">{value} / 10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-text-muted">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Alternative Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setErrors({});
        }}
        error={errors.name}
        placeholder="e.g. Migrate to AWS Cloud, Use self-hosted DB"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-success uppercase tracking-wider">
            Pros (Advantages)
          </label>
          <textarea
            className="input-field min-h-[80px] resize-y border-success/20 focus:border-success focus:ring-success/10"
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            placeholder="List the pros, one per line..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-error uppercase tracking-wider">
            Cons (Disadvantages)
          </label>
          <textarea
            className="input-field min-h-[80px] resize-y border-error/20 focus:border-error focus:ring-error/10"
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            placeholder="List the cons, one per line..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {renderSlider('Cost/Budget', cost, setCost, 'Inexpensive (1)', 'Very Expensive (10)')}
        {renderSlider('Quality/Impact', quality, setQuality, 'Low (1)', 'High (10)')}
        {renderSlider('Risk Assessment', risk, setRisk, 'Low Risk (1)', 'High Risk (10)')}
        {renderSlider('Feasibility', feasibility, setFeasibility, 'Hard (1)', 'Easy (10)')}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {initialData ? 'Save Alternative' : 'Add Alternative'}
        </Button>
      </div>
    </form>
  );
};

export default AlternativeForm;
