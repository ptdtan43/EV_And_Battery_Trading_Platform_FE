import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Clock,
  Tag,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Zap,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  NOTIFICATION_TYPES,
} from "../lib/notificationApi";

export const Notifications = () => {
  const { user } = useAuth();
  const { show: showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showRead, setShowRead] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getUserNotifications(
        user.id || user.userId || user.accountId,
        page,
        20
      );

      if (page === 1) {
        setNotifications(response.notifications || []);
      } else {
        setNotifications((prev) => [
          ...prev,
          ...(response.notifications || []),
        ]);
      }

      setHasMore(response.hasMore || false);
    } catch (error) {
      console.error("Error loading notifications:", error);
      showToast({
        title: "Lỗi tải thông báo",
        description: "Không thể tải danh sách thông báo",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => {
          const nId = n.notificationId || n.id;
          return nId === notificationId ? { ...n, isRead: true } : n;
        })
      );

      // Dispatch event to update notification bell
      window.dispatchEvent(new CustomEvent("notificationRead"));

      showToast({
        title: "Đã đánh dấu đã đọc",
        description: "Thông báo đã được đánh dấu là đã đọc",
        type: "success",
      });
    } catch (error) {
      console.error("Error marking as read:", error);
      showToast({
        title: "Lỗi",
        description: error.message || "Không thể đánh dấu thông báo đã đọc",
        type: "error",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const successCount = await markAllAsRead(user.id || user.userId || user.accountId);
      
      // Only update UI if backend actually saved the changes
      if (successCount > 0) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

        // Dispatch event to update notification bell
        window.dispatchEvent(new CustomEvent("allNotificationsRead"));

        showToast({
          title: "Đã đánh dấu tất cả đã đọc",
          description: `${successCount} thông báo đã được đánh dấu là đã đọc`,
          type: "success",
        });
      } else {
        showToast({
          title: "Không có thông báo nào được cập nhật",
          description: "Có thể tất cả thông báo đã được đọc rồi",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      showToast({
        title: "Lỗi",
        description: error.message || "Không thể đánh dấu tất cả thông báo đã đọc",
        type: "error",
      });
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      
      // Remove from UI
      setNotifications((prev) => prev.filter((n) => {
        const nId = n.notificationId || n.id;
        return nId !== notificationId;
      }));

      // Dispatch event to update notification bell
      window.dispatchEvent(new CustomEvent("notificationDeleted"));

      showToast({
        title: "Đã xóa thông báo",
        description: "Thông báo đã được xóa khỏi danh sách",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      showToast({
        title: "Lỗi",
        description: error.message || "Không thể xóa thông báo",
        type: "error",
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.POST_CREATED:
        return <Zap className="h-5 w-5 text-blue-600" />;
      case NOTIFICATION_TYPES.POST_APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case NOTIFICATION_TYPES.POST_REJECTED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case NOTIFICATION_TYPES.POST_SOLD:
        return <Star className="h-5 w-5 text-yellow-600" />;
      case NOTIFICATION_TYPES.MESSAGE_RECEIVED:
        return <Bell className="h-5 w-5 text-purple-600" />;
      case NOTIFICATION_TYPES.SYSTEM_UPDATE:
        return <Info className="h-5 w-5 text-indigo-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.POST_CREATED:
        return "bg-blue-100";
      case NOTIFICATION_TYPES.POST_APPROVED:
        return "bg-green-100";
      case NOTIFICATION_TYPES.POST_REJECTED:
        return "bg-red-100";
      case NOTIFICATION_TYPES.POST_SOLD:
        return "bg-yellow-100";
      case NOTIFICATION_TYPES.MESSAGE_RECEIVED:
        return "bg-purple-100";
      case NOTIFICATION_TYPES.SYSTEM_UPDATE:
        return "bg-indigo-100";
      default:
        return "bg-gray-100";
    }
  };

  const getNotificationBorderColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.POST_CREATED:
        return "border-l-blue-500";
      case NOTIFICATION_TYPES.POST_APPROVED:
        return "border-l-green-500";
      case NOTIFICATION_TYPES.POST_REJECTED:
        return "border-l-red-500";
      case NOTIFICATION_TYPES.POST_SOLD:
        return "border-l-yellow-500";
      case NOTIFICATION_TYPES.MESSAGE_RECEIVED:
        return "border-l-purple-500";
      case NOTIFICATION_TYPES.SYSTEM_UPDATE:
        return "border-l-indigo-500";
      default:
        return "border-l-gray-500";
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.POST_CREATED:
        return "Tạo bài đăng";
      case NOTIFICATION_TYPES.POST_APPROVED:
        return "Duyệt bài đăng";
      case NOTIFICATION_TYPES.POST_REJECTED:
        return "Từ chối bài đăng";
      case NOTIFICATION_TYPES.POST_SOLD:
        return "Bán thành công";
      case NOTIFICATION_TYPES.MESSAGE_RECEIVED:
        return "Tin nhắn mới";
      case NOTIFICATION_TYPES.SYSTEM_UPDATE:
        return "Cập nhật hệ thống";
      default:
        return "Thông báo";
    }
  };

  const filteredNotifications = notifications
    .filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.content.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterType === "all" || notification.notificationType === filterType;

      const matchesReadStatus = showRead || !notification.isRead;

      return matchesSearch && matchesFilter && matchesReadStatus;
    })
    .sort((a, b) => {
      // Sort by creation date (newest first)
      const dateA = new Date(a.createdAt || a.createdDate || 0);
      const dateB = new Date(b.createdAt || b.createdDate || 0);
      return dateB - dateA;
    });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Vui lòng đăng nhập
          </h2>
          <p className="text-gray-600">Bạn cần đăng nhập để xem thông báo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 vietnamese-text notifications-page">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 vietnamese-text notification-text">
                  Thông báo
                </h1>
                <p className="text-gray-600 vietnamese-text notification-text">
                  {unreadCount > 0
                    ? `Bạn có ${unreadCount} thông báo chưa đọc`
                    : "Bạn đã đọc tất cả thông báo"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Đánh dấu tất cả đã đọc</span>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent vietnamese-text notification-text"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả loại</option>
              <option value={NOTIFICATION_TYPES.POST_CREATED}>
                Tạo bài đăng
              </option>
              <option value={NOTIFICATION_TYPES.POST_APPROVED}>
                Duyệt bài đăng
              </option>
              <option value={NOTIFICATION_TYPES.POST_REJECTED}>
                Từ chối bài đăng
              </option>
              <option value={NOTIFICATION_TYPES.POST_SOLD}>
                Bán thành công
              </option>
              <option value={NOTIFICATION_TYPES.MESSAGE_RECEIVED}>
                Tin nhắn
              </option>
              <option value={NOTIFICATION_TYPES.SYSTEM_UPDATE}>Hệ thống</option>
            </select>

            <button
              onClick={() => setShowRead(!showRead)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                showRead
                  ? "bg-gray-100 text-gray-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {showRead ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span>{showRead ? "Ẩn đã đọc" : "Hiện đã đọc"}</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Đang tải thông báo...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterType !== "all"
                  ? "Không tìm thấy thông báo phù hợp"
                  : "Bạn chưa có thông báo nào"}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== "all"
                  ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                  : "Thông báo sẽ xuất hiện khi có hoạt động mới"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <div
                key={notification.notificationId || notification.id || index}
                className={`bg-white rounded-2xl shadow-lg border-l-4 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
                  notification.isRead
                    ? "opacity-75 border-l-gray-300"
                    : `${getNotificationBorderColor(
                        notification.notificationType
                      )} shadow-blue-100`
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-xl ${
                      notification.isRead
                        ? "bg-gray-100"
                        : getNotificationBgColor(notification.notificationType)
                    }`}
                  >
                    {getNotificationIcon(notification.notificationType)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3
                            className={`text-lg font-semibold vietnamese-text notification-title ${
                              notification.isRead
                                ? "text-gray-700"
                                : "text-gray-900"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                              Mới
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-4 leading-relaxed vietnamese-text notification-content">
                          {notification.content}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(
                                notification.createdAt ||
                                  notification.createdDate
                              ).toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>
                          <span className="flex items-center space-x-2">
                            <Tag className="h-4 w-4" />
                            <span className="font-medium">
                              {getNotificationTypeLabel(
                                notification.notificationType
                              )}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.notificationId || notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Đánh dấu đã đọc"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.notificationId || notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => setPage(page + 1)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tải thêm thông báo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
