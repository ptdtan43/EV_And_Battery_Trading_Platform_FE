import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getUnreadCount, markAllAsRead } from "../../lib/notificationApi";

export const NotificationBell = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    // If already on notifications page, scroll to top
    if (location.pathname === "/notifications") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  // Load unread count
  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  // Refresh unread count when notifications change
  useEffect(() => {
    const handleNotificationChange = () => {
      if (user) {
        console.log("🔔 Notification change detected, refreshing count...");
        loadUnreadCount();
      }
    };

    // Listen for custom events from Notifications page
    window.addEventListener("notificationRead", handleNotificationChange);
    window.addEventListener("notificationDeleted", handleNotificationChange);
    window.addEventListener("allNotificationsRead", handleNotificationChange);

    return () => {
      window.removeEventListener("notificationRead", handleNotificationChange);
      window.removeEventListener(
        "notificationDeleted",
        handleNotificationChange
      );
      window.removeEventListener(
        "allNotificationsRead",
        handleNotificationChange
      );
    };
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      setIsLoading(true);
      const count = await getUnreadCount(
        user.id || user.userId || user.accountId
      );
      setUnreadCount(count);
      console.log("🔔 Unread count updated:", count);

      // If count is 0, remove the number from bell
      if (count === 0) {
        console.log("🔔 No unread notifications, hiding number");
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      await markAllAsRead(user.id || user.userId || user.accountId);
      setUnreadCount(0);
      console.log("🔔 All notifications marked as read");

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent("allNotificationsRead"));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="notification-bell">
      <Link
        to="/notifications"
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors group"
        title="Thông báo"
        onClick={handleClick}
      >
        <div className="relative">
          <Bell className="h-5 w-5 transition-colors duration-300" />
          {unreadCount > 0 && (
            <div
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center shadow-lg ring-2 ring-white hover:scale-110 transition-all duration-300 cursor-pointer hover:bg-red-600 hover:shadow-xl hover:ring-red-300"
              title={`${unreadCount} thông báo chưa đọc`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
          {unreadCount === 0 && (
            <div className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center shadow-lg ring-2 ring-white opacity-0 transition-all duration-300 pointer-events-none">
              0
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};
