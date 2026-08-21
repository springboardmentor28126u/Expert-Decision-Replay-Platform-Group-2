// Roles API service
import api from './api';

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export const rolesService = {
  async getRoles(): Promise<Role[]> {
    const { data } = await api.get('/roles');
    return data;
  },
};
