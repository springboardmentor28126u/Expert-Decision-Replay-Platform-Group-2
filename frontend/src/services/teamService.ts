// Team management API service
import api from './api';
import type { Team, TeamMember, TeamCreatePayload, TeamUpdatePayload, TeamMemberAddPayload } from '../types/team';

export const teamService = {
  async getTeams(): Promise<Team[]> {
    const { data } = await api.get('/teams');
    return data;
  },

  async getTeam(id: string): Promise<Team> {
    const { data } = await api.get(`/teams/${id}`);
    return data;
  },

  async createTeam(payload: TeamCreatePayload): Promise<Team> {
    const { data } = await api.post('/teams', payload);
    return data;
  },

  async updateTeam(id: string, payload: TeamUpdatePayload): Promise<Team> {
    const { data } = await api.put(`/teams/${id}`, payload);
    return data;
  },

  async deleteTeam(id: string): Promise<void> {
    await api.delete(`/teams/${id}`);
  },

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data } = await api.get(`/teams/${teamId}/members`);
    return data;
  },

  async addTeamMember(teamId: string, payload: TeamMemberAddPayload): Promise<TeamMember> {
    const { data } = await api.post(`/teams/${teamId}/members`, payload);
    return data;
  },

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await api.delete(`/teams/${teamId}/members/${userId}`);
  },
};
