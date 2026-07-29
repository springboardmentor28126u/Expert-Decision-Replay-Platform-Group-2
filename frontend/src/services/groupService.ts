import api from './api';

export interface Group {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface GroupOwnerSummary {
  id: string;
  full_name: string;
  avatar_initial: string;
}

export interface AvailableGroup {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  owner: GroupOwnerSummary;
  member_count: number;
  pending_request_id: string | null;
  pending_request_status: string | null;
}

export interface GroupJoinRequest {
  id: string;
  group_id: string;
  group_name: string;
  group_description: string | null;
  requested_by: string;
  requester_name: string;
  requester_initial: string;
  requested_to: string;
  owner_name: string;
  owner_initial: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  decided_at: string | null;
  decided_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminGroupListItem {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  owner_id: string;
  member_count: number;
  pending_request_count: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
  joined_at: string;
  is_active: boolean;
  full_name: string | null;
  email: string | null;
}

export interface AdminGroupDetailResponse extends AdminGroupListItem {
  members: AdminGroupMember[];
  pending_requests: GroupJoinRequest[];
}

export const groupService = {
  list: async (companyId: string): Promise<Group[]> => {
    const response = await api.get('/groups/my', { params: { company_id: companyId } });
    return response.data;
  },

  available: async (companyId: string): Promise<AvailableGroup[]> => {
    const response = await api.get('/groups', { params: { company_id: companyId } });
    return response.data;
  },

  requestToJoin: async (groupId: string, message?: string): Promise<GroupJoinRequest> => {
    const response = await api.post(`/groups/${groupId}/join-request`, { message: message || null });
    return response.data;
  },

  myRequests: async (): Promise<GroupJoinRequest[]> => {
    const response = await api.get('/my-requests');
    return response.data;
  },

  adminRequests: async (status?: string, groupId?: string): Promise<GroupJoinRequest[]> => {
    const response = await api.get('/group-requests', { params: { status: status || undefined, group_id: groupId || undefined } });
    return response.data;
  },

  pendingRequestCount: async (): Promise<number> => {
    const response = await api.get('/group-requests/pending-count');
    return response.data.total;
  },

  decideRequest: async (requestId: string, decision: 'accept' | 'reject'): Promise<GroupJoinRequest> => {
    const response = await api.post(`/group-requests/${requestId}/decide`, { decision });
    return response.data;
  },

  adminGroups: async (): Promise<AdminGroupListItem[]> => {
    const response = await api.get('/admin/groups');
    return response.data;
  },

  createAdminGroup: async (payload: { name: string; description?: string | null; department?: string | null }): Promise<AdminGroupListItem> => {
    const response = await api.post('/admin/groups', payload);
    return response.data;
  },

  getAdminGroup: async (groupId: string): Promise<AdminGroupDetailResponse> => {
    const response = await api.get(`/admin/groups/${groupId}`);
    return response.data;
  },

  updateAdminGroup: async (
    groupId: string,
    payload: { name?: string | null; description?: string | null; department?: string | null }
  ): Promise<AdminGroupListItem> => {
    const response = await api.patch(`/admin/groups/${groupId}`, payload);
    return response.data;
  },

  deactivateAdminGroup: async (groupId: string): Promise<AdminGroupListItem> => {
    const response = await api.patch(`/admin/groups/${groupId}/deactivate`, {});
    return response.data;
  },
};
