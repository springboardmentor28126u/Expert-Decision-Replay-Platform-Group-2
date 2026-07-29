import api from './api';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export const notificationService = {
  list: async (limit = 20): Promise<Notification[]> => {
    const response = await api.get('/notifications', { params: { limit } });
    return response.data;
  },

  unreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.total;
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read');
  },
};
