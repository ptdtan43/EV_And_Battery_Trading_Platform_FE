/**
 * ===================================================================
 * API MANAGER - VÍ DỤ SỬ DỤNG THỰC TẾ
 * ===================================================================
 * 
 * File này chứa các ví dụ sử dụng API trong các tình huống thực tế
 */

import api from './index';

// ===================================================================
// 1. AUTHENTICATION EXAMPLES
// ===================================================================

/**
 * Example: Login flow
 */
export async function exampleLogin() {
    try {
        const response = await api.auth.login({
            email: 'user@example.com',
            password: 'password123'
        });

        console.log('✅ Login successful:', response);

        // Token được tự động lưu vào localStorage
        // Không cần xử lý thủ công

        return response;
    } catch (error) {
        console.error('❌ Login failed:', error.message);

        // Hiển thị thông báo lỗi cho user
        alert(`Đăng nhập thất bại: ${error.message}`);

        throw error;
    }
}

/**
 * Example: Registration flow
 */
export async function exampleRegister() {
    try {
        const response = await api.auth.register({
            email: 'newuser@example.com',
            password: 'securePassword123',
            fullName: 'Nguyễn Văn A',
            phone: '0123456789',
            address: 'Hà Nội, Việt Nam'
        });

        console.log('✅ Registration successful:', response);
        return response;
    } catch (error) {
        console.error('❌ Registration failed:', error.message);
        throw error;
    }
}

// ===================================================================
// 2. PRODUCT EXAMPLES
// ===================================================================

/**
 * Example: Fetch and display products
 */
export async function exampleFetchProducts() {
    try {
        const products = await api.product.getAll();

        console.log(`✅ Fetched ${products.length} products`);

        // Filter chỉ lấy sản phẩm đang active
        const activeProducts = products.filter(p => p.status === 'Active');

        return activeProducts;
    } catch (error) {
        console.error('❌ Failed to fetch products:', error.message);
        return [];
    }
}

/**
 * Example: Create new product with images
 */
export async function exampleCreateProduct() {
    try {
        // Step 1: Create product
        const productData = {
            name: 'Tesla Model 3 Standard Range Plus',
            description: 'Electric sedan with autopilot',
            price: 1200000000, // 1.2 tỷ VNĐ
            category: 'Electric Sedan',
            productType: 'Vehicle',
            sellerId: 1,
            specifications: {
                year: 2023,
                mileage: 0,
                color: 'Pearl White',
                battery: '50 kWh',
                range: '420 km'
            }
        };

        const newProduct = await api.product.create(productData);
        console.log('✅ Product created:', newProduct);

        // Step 2: Upload images (nếu có)
        const imageFiles = [/* File objects */];
        if (imageFiles.length > 0) {
            const formData = new FormData();
            formData.append('productId', newProduct.id);
            imageFiles.forEach((file, index) => {
                formData.append(`images[${index}]`, file);
            });

            await api.product.images.uploadMultiple(formData);
            console.log('✅ Images uploaded');
        }

        return newProduct;
    } catch (error) {
        console.error('❌ Failed to create product:', error.message);
        throw error;
    }
}

/**
 * Example: Search products with filters
 */
export async function exampleSearchProducts(filters) {
    try {
        const searchParams = {
            keyword: filters.keyword || '',
            minPrice: filters.minPrice || 0,
            maxPrice: filters.maxPrice || 999999999999,
            category: filters.category || '',
            productType: filters.productType || '',
            sortBy: filters.sortBy || 'createdAt',
            sortOrder: filters.sortOrder || 'desc',
            page: filters.page || 1,
            limit: filters.limit || 20
        };

        const results = await api.search.products(searchParams);

        console.log(`✅ Found ${results.length} products`);
        return results;
    } catch (error) {
        console.error('❌ Search failed:', error.message);
        return [];
    }
}

// ===================================================================
// 3. ORDER & PAYMENT EXAMPLES
// ===================================================================

/**
 * Example: Complete order flow with VNPay payment
 */
export async function exampleCompleteOrder(productId, userId) {
    try {
        // Step 1: Create order
        const orderData = {
            userId: userId,
            productId: productId,
            totalAmount: 1200000000, // Should get from product
            shippingAddress: 'Hà Nội, Việt Nam',
            notes: 'Giao hàng giờ hành chính'
        };

        const order = await api.order.create(orderData);
        console.log('✅ Order created:', order);

        // Step 2: Create VNPay payment
        const paymentData = {
            orderId: order.id,
            amount: order.totalAmount,
            orderInfo: `Thanh toán đơn hàng #${order.id}`,
            returnUrl: `${window.location.origin}/payment/callback`
        };

        // This will redirect to VNPay
        await api.payment.processVNPay(paymentData);

        // User will be redirected to VNPay, then back to returnUrl

    } catch (error) {
        console.error('❌ Order failed:', error.message);
        alert(`Đặt hàng thất bại: ${error.message}`);
        throw error;
    }
}

/**
 * Example: Get user's order history
 */
export async function exampleGetOrderHistory(userId) {
    try {
        const orders = await api.order.getByUser(userId);

        console.log(`✅ User has ${orders.length} orders`);

        // Group by status
        const groupedOrders = orders.reduce((acc, order) => {
            const status = order.status || 'Unknown';
            if (!acc[status]) acc[status] = [];
            acc[status].push(order);
            return acc;
        }, {});

        console.log('Orders by status:', groupedOrders);

        return orders;
    } catch (error) {
        console.error('❌ Failed to get order history:', error.message);
        return [];
    }
}

// ===================================================================
// 4. FAVORITE EXAMPLES
// ===================================================================

/**
 * Example: Toggle favorite with UI update
 */
export async function exampleToggleFavorite(userId, productId) {
    try {
        // Check current status
        const isFavorited = await api.favorite.isFavorited(userId, productId);

        // Toggle
        await api.favorite.toggle(userId, productId);

        console.log(`✅ Product ${isFavorited ? 'removed from' : 'added to'} favorites`);

        return !isFavorited; // Return new status
    } catch (error) {
        console.error('❌ Failed to toggle favorite:', error.message);
        throw error;
    }
}

/**
 * Example: Get user's favorite products with details
 */
export async function exampleGetFavoriteProducts(userId) {
    try {
        // Get favorites
        const favorites = await api.favorite.getByUser(userId);

        // Fetch full product details
        const productPromises = favorites.map(fav =>
            api.product.getById(fav.productId)
        );

        const products = await Promise.all(productPromises);

        console.log(`✅ User has ${products.length} favorite products`);
        return products;
    } catch (error) {
        console.error('❌ Failed to get favorites:', error.message);
        return [];
    }
}

// ===================================================================
// 5. NOTIFICATION EXAMPLES
// ===================================================================

/**
 * Example: Fetch and display notifications
 */
export async function exampleFetchNotifications(userId) {
    try {
        const notifications = await api.notification.getByUser(userId);

        // Separate unread and read
        const unread = notifications.filter(n => !n.isRead);
        const read = notifications.filter(n => n.isRead);

        console.log(`✅ ${unread.length} unread, ${read.length} read notifications`);

        return { unread, read, all: notifications };
    } catch (error) {
        console.error('❌ Failed to fetch notifications:', error.message);
        return { unread: [], read: [], all: [] };
    }
}

/**
 * Example: Mark all notifications as read
 */
export async function exampleMarkAllNotificationsRead(userId) {
    try {
        await api.notification.markAllAsRead(userId);
        console.log('✅ All notifications marked as read');
    } catch (error) {
        console.error('❌ Failed to mark notifications as read:', error.message);
    }
}

// ===================================================================
// 6. VERIFICATION EXAMPLES (For Admin)
// ===================================================================

/**
 * Example: Request vehicle verification
 */
export async function exampleRequestVerification(productId) {
    try {
        await api.verification.request(productId);
        console.log('✅ Verification request submitted');

        // Optionally create notification for admin
        // This would be done by backend in real scenario

    } catch (error) {
        console.error('❌ Failed to request verification:', error.message);
        throw error;
    }
}

/**
 * Example: Admin reviews verification requests
 */
export async function exampleReviewVerificationRequests() {
    try {
        const requests = await api.verification.getRequests();

        console.log(`✅ ${requests.length} verification requests pending`);

        // Filter by status
        const pending = requests.filter(r => r.verificationStatus === 'Requested');
        const inProgress = requests.filter(r => r.verificationStatus === 'InProgress');

        return { pending, inProgress, all: requests };
    } catch (error) {
        console.error('❌ Failed to get verification requests:', error.message);
        return { pending: [], inProgress: [], all: [] };
    }
}

/**
 * Example: Admin approves verification
 */
export async function exampleApproveVerification(productId) {
    try {
        await api.verification.updateStatus(
            productId,
            'Completed',
            'Vehicle inspection passed. All documents verified.'
        );

        console.log('✅ Verification approved');

        // You might want to send notification to seller
        // await api.notification.create({ ... });

    } catch (error) {
        console.error('❌ Failed to approve verification:', error.message);
        throw error;
    }
}

// ===================================================================
// 7. STATISTICS EXAMPLES
// ===================================================================

/**
 * Example: Get dashboard statistics
 */
export async function exampleGetDashboardStats(userId) {
    try {
        const stats = await api.statistics.getDashboard(userId);

        console.log('✅ Dashboard stats:', stats);

        return {
            totalProducts: stats.totalProducts || 0,
            totalOrders: stats.totalOrders || 0,
            totalRevenue: stats.totalRevenue || 0,
            pendingOrders: stats.pendingOrders || 0
        };
    } catch (error) {
        console.error('❌ Failed to get dashboard stats:', error.message);
        return null;
    }
}

/**
 * Example: Get admin statistics
 */
export async function exampleGetAdminStats() {
    try {
        const stats = await api.statistics.getAdmin();

        console.log('✅ Admin stats:', stats);

        return {
            totalUsers: stats.totalUsers || 0,
            totalProducts: stats.totalProducts || 0,
            totalOrders: stats.totalOrders || 0,
            totalRevenue: stats.totalRevenue || 0,
            activeUsers: stats.activeUsers || 0,
            pendingVerifications: stats.pendingVerifications || 0
        };
    } catch (error) {
        console.error('❌ Failed to get admin stats:', error.message);
        return null;
    }
}

// ===================================================================
// 8. CHAT EXAMPLES
// ===================================================================

/**
 * Example: Start chat with seller
 */
export async function exampleStartChat(buyerId, sellerId, productId) {
    try {
        // Create or get existing conversation
        const participants = [buyerId, sellerId];
        const conversation = await api.chat.createConversation(participants);

        console.log('✅ Conversation created:', conversation);

        // Send initial message
        await api.chat.sendMessage({
            conversationId: conversation.id,
            senderId: buyerId,
            message: `Xin chào, tôi quan tâm đến sản phẩm #${productId}. Bạn có thể cho tôi biết thêm thông tin không?`,
            messageType: 'text'
        });

        console.log('✅ Initial message sent');

        return conversation;
    } catch (error) {
        console.error('❌ Failed to start chat:', error.message);
        throw error;
    }
}

// ===================================================================
// 9. BATCH OPERATIONS
// ===================================================================

/**
 * Example: Batch fetch multiple products
 */
export async function exampleBatchFetchProducts(productIds) {
    try {
        // Fetch all products in parallel
        const products = await Promise.all(
            productIds.map(id => api.product.getById(id))
        );

        console.log(`✅ Fetched ${products.length} products in batch`);
        return products;
    } catch (error) {
        console.error('❌ Batch fetch failed:', error.message);
        return [];
    }
}

/**
 * Example: Bulk update product status (Admin)
 */
export async function exampleBulkApproveProducts(productIds) {
    try {
        const results = await Promise.allSettled(
            productIds.map(id => api.product.approve(id))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`✅ Approved ${successful} products, ${failed} failed`);

        return { successful, failed, results };
    } catch (error) {
        console.error('❌ Bulk approve failed:', error.message);
        throw error;
    }
}

// ===================================================================
// 10. ERROR HANDLING PATTERNS
// ===================================================================

/**
 * Example: Comprehensive error handling
 */
export async function exampleWithErrorHandling() {
    try {
        const products = await api.product.getAll();
        return products;
    } catch (error) {
        // Handle specific error codes
        if (error.status === 401) {
            console.error('Unauthorized - redirecting to login...');
            // Auto handled by apiRequest, but you can add custom logic
        } else if (error.status === 403) {
            console.error('Forbidden - insufficient permissions');
            alert('Bạn không có quyền truy cập tính năng này');
        } else if (error.status === 404) {
            console.error('Not found');
            alert('Không tìm thấy dữ liệu');
        } else if (error.status >= 500) {
            console.error('Server error');
            alert('Lỗi máy chủ, vui lòng thử lại sau');
        } else {
            console.error('Unknown error:', error);
            alert(`Đã xảy ra lỗi: ${error.message}`);
        }

        return null;
    }
}

/**
 * Example: Retry on failure
 */
export async function exampleWithRetry(maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const products = await api.product.getAll();
            return products;
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed, retrying...`);

            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }

    throw new Error(`Failed after ${maxRetries} retries: ${lastError.message}`);
}

// ===================================================================
// EXPORT ALL EXAMPLES
// ===================================================================

export default {
    // Auth
    login: exampleLogin,
    register: exampleRegister,

    // Products
    fetchProducts: exampleFetchProducts,
    createProduct: exampleCreateProduct,
    searchProducts: exampleSearchProducts,

    // Orders & Payments
    completeOrder: exampleCompleteOrder,
    getOrderHistory: exampleGetOrderHistory,

    // Favorites
    toggleFavorite: exampleToggleFavorite,
    getFavoriteProducts: exampleGetFavoriteProducts,

    // Notifications
    fetchNotifications: exampleFetchNotifications,
    markAllNotificationsRead: exampleMarkAllNotificationsRead,

    // Verification
    requestVerification: exampleRequestVerification,
    reviewVerificationRequests: exampleReviewVerificationRequests,
    approveVerification: exampleApproveVerification,

    // Statistics
    getDashboardStats: exampleGetDashboardStats,
    getAdminStats: exampleGetAdminStats,

    // Chat
    startChat: exampleStartChat,

    // Batch Operations
    batchFetchProducts: exampleBatchFetchProducts,
    bulkApproveProducts: exampleBulkApproveProducts,

    // Error Handling
    withErrorHandling: exampleWithErrorHandling,
    withRetry: exampleWithRetry
};

