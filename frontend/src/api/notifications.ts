import client from "./client";

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  getNotifications: async (unreadOnly = false, limit = 50) => {
    const response = await client.get<NotificationItem[]>("/api/notifications/", {
      params: { unread_only: unreadOnly, limit },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await client.get<{ unread_count: number }>("/api/notifications/unread-count");
    return response.data.unread_count;
  },

  markAsRead: async (id: number) => {
    const response = await client.patch<NotificationItem>(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await client.patch<{ message: string; updated: number }>("/api/notifications/read-all");
    return response.data;
  },
};
