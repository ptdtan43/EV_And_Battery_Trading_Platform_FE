// Real Notification API using backend endpoints
import { apiRequest } from './api';

export const NOTIFICATION_TYPES = {
  POST_CREATED: "post_created",
  POST_APPROVED: "post_approved",
  POST_REJECTED: "post_rejected",
  POST_SOLD: "post_sold",
  POST_UPDATED: "post_updated", // NEW - Member updated post
  POST_REPORTED: "post_reported", // NEW - Member reported post
  MESSAGE_RECEIVED: "message_received",
  SYSTEM_ANNOUNCEMENT: "system_announcement",
  VERIFICATION_PAYMENT_SUCCESS: "verification_payment_success",
  VERIFICATION_COMPLETED: "verification_completed", // NEW - Admin completed verification
  TEST: "test"
};

/**
 * Create notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (notificationData) => {
  console.log("Creating notification:", notificationData);

  try {
    const response = await apiRequest('/api/Notification', {
      method: 'POST',
      body: notificationData
    });

    console.log("Notification created successfully:", response);
    return response;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Get user notifications
 * @param {number} userId - User ID
 * @param {number} page - Page number
 * @param {number} pageSize - Page size
 * @returns {Promise<Object>} Notifications with pagination
 */
export const getUserNotifications = async (userId, page = 1, pageSize = 10) => {
  console.log("Getting notifications for user:", userId);

  try {
    const response = await apiRequest(`/api/Notification/user/${userId}`);
    console.log("Retrieved notifications:", response);

    // Handle different response formats
    let notifications = [];
    if (Array.isArray(response)) {
      notifications = response;
    } else if (response.notifications && Array.isArray(response.notifications)) {
      notifications = response.notifications;
    } else if (response.data && Array.isArray(response.data)) {
      notifications = response.data;
    }

    // Debug notification structure
    console.log("First notification structure:", notifications[0]);
    console.log("All notification IDs:", notifications.map(n => ({ id: n.id, notificationId: n.notificationId })));

    // Add pagination info
    const result = {
      notifications: notifications,
      totalCount: notifications.length,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(notifications.length / pageSize),
      hasMore: false
    };

    console.log("Processed notifications result:", result);
    return result;
  } catch (error) {
    console.error("Error getting user notifications:", error);
    throw error;
  }
};

/**
 * Get unread count
 * @param {number} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export const getUnreadCount = async (userId) => {
  console.log("Getting unread count for user:", userId);

  try {
    const response = await apiRequest(`/api/Notification/user/${userId}`);
    console.log("Raw response for unread count:", response);

    // Handle different response formats
    let notifications = [];
    if (Array.isArray(response)) {
      notifications = response;
    } else if (response.notifications && Array.isArray(response.notifications)) {
      notifications = response.notifications;
    } else if (response.data && Array.isArray(response.data)) {
      notifications = response.data;
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    console.log("Unread count:", unreadCount);
    return unreadCount;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (notificationId) => {
  console.log("Marking notification as read:", notificationId);

  if (!notificationId) {
    console.error("Notification ID is undefined or null");
    throw new Error("Notification ID is required");
  }

  try {
    // Use the correct endpoint for users: PUT /api/Notification/{id}/read
    const response = await apiRequest(`/api/Notification/${notificationId}/read`, {
      method: 'PUT'
    });

    console.log("Notification marked as read:", response);
    return { id: notificationId, isRead: true, ...response };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    console.error("Error details:", {
      message: error.message,
      notificationId: notificationId,
      stack: error.stack
    });
    throw new Error(error.message || "Không thể đánh dấu thông báo đã đọc. Vui lòng thử lại.");
  }
};

/**
 * Mark all notifications as read
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
export const markAllAsRead = async (userId) => {
  console.log("Marking all notifications as read for user:", userId);

  try {
    // Use the new bulk endpoint: PUT /api/Notification/mark-all-read
    const response = await apiRequest('/api/Notification/mark-all-read', {
      method: 'PUT'
    });

    console.log("Bulk mark all as read successful:", response);
    console.log("Response type:", typeof response);
    console.log("Response keys:", Object.keys(response || {}));
    
    // Handle different response formats
    if (typeof response === 'object' && response !== null) {
      // Backend returns { message: "...", count: X }
      const count = response.count ?? response.Count ?? 0;
      console.log("Extracted count:", count);
      return count;
    }
    
    return 0;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response
    });
    throw new Error(error.message || "Không thể đánh dấu tất cả thông báo đã đọc. Vui lòng thử lại.");
  }
};

/**
 * Delete notification
 * @param {number} notificationId - Notification ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteNotification = async (notificationId) => {
  console.log("Deleting notification:", notificationId);

  if (!notificationId) {
    console.error("Notification ID is undefined or null");
    throw new Error("Notification ID is required");
  }

  try {
    // Backend returns 204 No Content on success
    const response = await apiRequest(`/api/Notification/${notificationId}`, {
      method: 'DELETE'
    });

    console.log("Notification deleted successfully:", response);
    // 204 No Content means success, response might be null/undefined
    return true;
  } catch (error) {
    console.error("Error deleting notification:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      notificationId: notificationId,
      data: error.data
    });
    
    // Provide specific error messages based on status
    let errorMessage = "Không thể xóa thông báo. Vui lòng thử lại.";
    if (error.status === 403) {
      errorMessage = "Bạn không có quyền xóa thông báo này.";
    } else if (error.status === 404) {
      errorMessage = "Thông báo không tồn tại.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Send notification for post created
 * @param {number} userId - User ID
 * @param {string} postTitle - Post title
 * @returns {Promise<boolean>} Success status
 */
export const notifyPostCreated = async (userId, postTitle) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.POST_CREATED,
      title: 'Bài đăng đã được tạo',
      content: `Bài đăng "${postTitle}" đã được tạo thành công và đang chờ duyệt.`
    });
    return true;
  } catch (error) {
    console.error('Error sending post created notification:', error);
    return false;
  }
};

/**
 * Send notification for post approved
 * @param {number} userId - User ID
 * @param {string} postTitle - Post title
 * @returns {Promise<boolean>} Success status
 */
export const notifyPostApproved = async (userId, postTitle) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.POST_APPROVED,
      title: 'Bài đăng đã được duyệt',
      content: `Bài đăng "${postTitle}" đã được admin duyệt và hiển thị trên trang chủ.`
    });
    return true;
  } catch (error) {
    console.error('Error sending post approved notification:', error);
    return false;
  }
};

/**
 * Send notification for post rejected
 * @param {number} userId - User ID
 * @param {string} postTitle - Post title
 * @returns {Promise<boolean>} Success status
 */
export const notifyPostRejected = async (userId, postTitle) => {
  try {
    await createNotification({
      userId,
      notificationType: NOTIFICATION_TYPES.POST_REJECTED,
      title: 'Bài đăng bị từ chối',
      content: `Bài đăng "${postTitle}" đã bị admin từ chối. Vui lòng kiểm tra và chỉnh sửa.`
    });
    return true;
  } catch (error) {
    console.error('Error sending post rejected notification:', error);
    return false;
  }
};

/**
 * Send notification to admin for successful verification payment
 * @param {number} adminUserId - Admin User ID
 * @param {string} productTitle - Product title
 * @param {number} productId - Product ID
 * @param {string} sellerName - Seller name
 * @param {number} amount - Payment amount
 * @returns {Promise<boolean>} Success status
 */
export const notifyAdminVerificationPaymentSuccess = async (adminUserId, productTitle, productId, sellerName, amount, paymentDate = null) => {
  try {
    // Format payment date for display
    let formattedDate = '';
    if (paymentDate) {
      try {
        const date = new Date(paymentDate);
        formattedDate = date.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (dateError) {
        console.warn('Error formatting payment date:', dateError);
        formattedDate = paymentDate.toString();
      }
    }

    await createNotification({
      userId: adminUserId,
      notificationType: NOTIFICATION_TYPES.VERIFICATION_PAYMENT_SUCCESS,
      title: '💰 Thanh toán kiểm định thành công',
      content: `Sản phẩm "${productTitle}" (ID: ${productId}) của người bán "${sellerName}" đã thanh toán ${amount.toLocaleString('vi-VN')} VNĐ cho dịch vụ kiểm định. Vui lòng thực hiện kiểm định xe.${formattedDate ? `\n\n📅 Thời gian thanh toán: ${formattedDate}` : ''}`,
      metadata: {
        productId: productId,
        sellerName: sellerName,
        amount: amount,
        paymentDate: paymentDate,
        formattedDate: formattedDate,
        actionRequired: 'inspection'
      }
    });
    return true;
  } catch (error) {
    console.error('Error sending verification payment success notification to admin:', error);
    return false;
  }
};

/**
 * Send notification to user when admin completed verification
 * @param {number} userId - User ID (seller)
 * @param {string} productTitle - Product title
 * @param {number} productId - Product ID
 * @param {string} verificationResult - Verification result (Verified/Rejected)
 * @param {string} adminNotes - Admin notes (optional)
 * @returns {Promise<boolean>} Success status
 */
export const notifyUserVerificationCompleted = async (userId, productTitle, productId, verificationResult, adminNotes = '') => {
  try {
    const isVerified = verificationResult === 'Verified';
    const emoji = isVerified ? '✅' : '❌';
    const title = isVerified ? 'Kiểm định xe thành công' : 'Kiểm định xe không đạt';
    const statusText = isVerified ? 'đã được kiểm định thành công' : 'không đạt yêu cầu kiểm định';

    let content = `Sản phẩm "${productTitle}" (ID: ${productId}) của bạn ${statusText}.`;

    if (adminNotes) {
      content += `\n\nGhi chú từ admin: ${adminNotes}`;
    }

    if (isVerified) {
      content += `\n\nSản phẩm của bạn giờ đã có chứng nhận kiểm định và sẽ được ưu tiên hiển thị trên trang chủ!`;
    } else {
      content += `\n\nBạn đã bị admin từ chối kiểm định.`;
      if (adminNotes) {
        content += `\n\nLý do từ chối: ${adminNotes}`;
      }
      content += `\n\nVui lòng cập nhật lại bài viết để gửi yêu cầu kiểm duyệt lại miễn phí.`;
    }

    await createNotification({
      userId: userId,
      notificationType: NOTIFICATION_TYPES.VERIFICATION_COMPLETED,
      title: `${emoji} ${title}`,
      content: content,
      metadata: {
        productId: productId,
        productTitle: productTitle,
        verificationResult: verificationResult,
        adminNotes: adminNotes,
        isVerified: isVerified,
        actionRequired: isVerified ? 'view_product' : 'contact_admin'
      }
    });
    return true;
  } catch (error) {
    console.error('Error sending verification completed notification to user:', error);
    return false;
  }
};

/**
 * Send notification to admin when member updates a product
 * @param {number} adminUserId - Admin user ID
 * @param {string} productTitle - Product title
 * @param {number} productId - Product ID
 * @param {string} sellerName - Seller name
 * @returns {Promise<boolean>} Success status
 */
export const notifyAdminProductUpdated = async (adminUserId, productTitle, productId, sellerName) => {
  try {
    console.log(`Sending product update notification to admin ${adminUserId} for product ${productId}`);

    await createNotification({
      userId: adminUserId,
      notificationType: NOTIFICATION_TYPES.POST_UPDATED,
      title: 'Bài đăng đã được cập nhật',
      content: `Người bán "${sellerName}" đã cập nhật bài đăng "${productTitle}" (ID: ${productId}). Vui lòng kiểm tra lại và duyệt bài đăng.`,
      metadata: {
        productId: productId,
        productTitle: productTitle,
        sellerName: sellerName,
        actionRequired: 'review_product',
        updatedDate: new Date().toISOString(),
        priority: 'high'
      }
    });

    console.log(`Product update notification sent to admin for product ${productId}`);
    return true;
  } catch (error) {
    console.error('Error sending product update notification to admin:', error);
    return false;
  }
};

/**
 * Notify admin when a member reports a product
 * @param {number} adminUserId - Admin user ID
 * @param {string} productTitle - Product title
 * @param {number} productId - Product ID
 * @param {string} reporterName - Reporter name
 * @param {string} reportType - Report type
 */
export const notifyAdminReportReceived = async (adminUserId, productTitle, productId, reporterName, reportType) => {
  try {
    console.log(`Sending report notification to admin ${adminUserId} for product ${productId}`);

    await createNotification({
      userId: adminUserId,
      notificationType: NOTIFICATION_TYPES.POST_REPORTED,
      title: 'Báo cáo vi phạm mới',
      content: `Người dùng "${reporterName}" đã báo cáo bài đăng "${productTitle}" (ID: ${productId}) với lý do: ${reportType}. Vui lòng xem xét và xử lý.`,
      metadata: {
        productId: productId,
        productTitle: productTitle,
        reporterName: reporterName,
        reportType: reportType,
        actionRequired: 'review_report',
        reportedDate: new Date().toISOString(),
        priority: 'high'
      }
    });

    console.log(`Report notification sent to admin for product ${productId}`);
    return true;
  } catch (error) {
    console.error('Error sending report notification to admin:', error);
    return false;
  }
};