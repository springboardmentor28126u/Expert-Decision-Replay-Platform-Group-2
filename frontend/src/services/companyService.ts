import api from './api';

export interface CompanyWithRole {
  id: string;
  name: string;
  slug: string;
  role: string;
  created_at: string;
}

export const companyService = {
  getMyCompany: async (): Promise<CompanyWithRole[]> => {
    const response = await api.get('/companies/me');
    return response.data;
  },
};
