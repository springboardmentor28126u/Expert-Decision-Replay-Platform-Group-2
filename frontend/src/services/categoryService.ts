import api from './api';
import type { DecisionCategory } from '../types/decision';

export const categoryService = {
  /** List all decision categories. */
  list: async (): Promise<DecisionCategory[]> => {
    const response = await api.get('/categories');
    return response.data;
  },
};
