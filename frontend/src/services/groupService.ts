import api from './api';

export interface Group {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
}

export const groupService = {
  list: async (companyId: string): Promise<Group[]> => {
    const response = await api.get('/groups', { params: { company_id: companyId } });
    return response.data;
  },
};
