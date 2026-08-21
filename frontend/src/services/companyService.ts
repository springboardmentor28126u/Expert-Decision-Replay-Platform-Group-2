// Company management API service
import api from './api';

export interface CompanyWithRole {
  id: string;
  name: string;
  slug: string;
  role: string;
  created_at: string;
}

export interface CompanyMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  joined_at: string;
}

export const companyService = {
  async getMyCompany(): Promise<CompanyWithRole[]> {
    const { data } = await api.get('/companies/me');
    return data;
  },

  async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    const { data } = await api.get(`/companies/${companyId}/members`);
    return data;
  },

  async inviteMember(companyId: string, email: string, role: string): Promise<void> {
    await api.post(`/companies/${companyId}/invite`, { email, role });
  },
};
