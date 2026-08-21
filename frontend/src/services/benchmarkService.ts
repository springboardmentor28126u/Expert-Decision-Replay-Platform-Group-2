import api from './api';

export interface BenchmarkResult {
  insufficient_data: boolean;
  similar_decision_count: number;
  avg_cost: number | null;
  avg_approval_days: number | null;
  avg_alternatives: number | null;
  rejection_rate: number | null;
  current_cost: number | null;
  delta_pct: number | null;
}

export interface CategoryTrend {
  category_id: string;
  category_name: string;
  decision_count: number;
  avg_cost: number;
  rejection_rate: number;
  approved_count: number;
  rejected_count: number;
}

export interface CategoryTrendsResult {
  trends: CategoryTrend[];
  months_covered: number;
}

export const benchmarkService = {
  getBenchmark: async (
    companyId: string,
    categoryId: string,
    financialImpact?: number,
  ): Promise<BenchmarkResult> => {
    const payload: Record<string, unknown> = { category_id: categoryId };
    if (financialImpact !== undefined) {
      payload.financial_impact = financialImpact;
    }
    const response = await api.post(`/decisions/benchmark`, payload);
    return response.data;
  },

  getCategoryTrends: async (
    companyId: string,
    months: number = 12,
  ): Promise<CategoryTrendsResult> => {
    const response = await api.get(`/decisions/benchmarks/category-trends`, {
      params: { months },
    });
    return response.data;
  },
};
