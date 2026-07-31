import React, { useState, useEffect } from 'react';

export default function NotificationBell({ token }) {
  // 1. Initialize state as an empty array []
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/notifications', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();

        // 2. Safe parsing: Handle direct array or nested object responses
        if (Array.isArray(data)) {
          setNotifications(data);
        } else if (data && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else if (data && Array.isArray(data.items)) {
          setNotifications(data.items);
        } else {
          setNotifications([]); // Fallback to empty array if unexpected structure
        }
      } catch (error) {
        console.error('Notification fetch error:', error);
        setNotifications([]); // Ensure array state on error
      }
    };

    fetchNotifications();
  }, [token]);

  // 3. Safe filtering: Check Array.isArray before calling .filter()
  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0;

  return (
    <div className="relative inline-block text-left">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white focus:outline-none"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-700 font-semibold text-gray-200">
            Notifications
          </div>

          <div className="max-h-60 overflow-y-auto">
            {!Array.isArray(notifications) || notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className={`px-4 py-3 text-sm border-b border-gray-700 last:border-0 ${
                    notification.is_read
                      ? 'text-gray-400 bg-gray-800'
                      : 'text-white bg-gray-700 font-medium'
                  }`}
                >
                  {notification.message || notification.content || 'New notification'}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}