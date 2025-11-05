# API Manager - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

File `src/api/apiManager.js` tổng hợp **TẤT CẢ** các API endpoint của hệ thống vào một nơi duy nhất, giúp:
- ✅ Dễ dàng quản lý và bảo trì
- ✅ Tránh trùng lặp code
- ✅ Cấu trúc rõ ràng, dễ tìm kiếm
- ✅ Type-safe với JSDoc comments
- ✅ Tự động xử lý authentication token

## 🗂️ Cấu Trúc API

API được tổ chức theo 15 modules chính:

1. **authAPI** - Xác thực người dùng
2. **userAPI** - Quản lý người dùng
3. **productAPI** - Quản lý sản phẩm
4. **orderAPI** - Quản lý đơn hàng
5. **paymentAPI** - Thanh toán
6. **favoriteAPI** - Yêu thích
7. **notificationAPI** - Thông báo
8. **chatAPI** - Chat/Tin nhắn
9. **reviewAPI** - Đánh giá
10. **verificationAPI** - Xác minh xe
11. **statisticsAPI** - Thống kê
12. **searchAPI** - Tìm kiếm
13. **categoryAPI** - Danh mục
14. **systemAPI** - Hệ thống

## 🚀 Cách Sử Dụng

### Cách 1: Import API Object (Khuyến Nghị)

```javascript
import api from '@/api';

// Authentication
const loginResponse = await api.auth.login({ email, password });
const registerResponse = await api.auth.register(userData);

// Products
const products = await api.product.getAll();
const product = await api.product.getById(productId);
const newProduct = await api.product.create(productData);

// Orders
const orders = await api.order.getByUser(userId);
const newOrder = await api.order.create(orderData);

// Payments
const payment = await api.payment.create(paymentData);
await api.payment.processVNPay(paymentData);

// Favorites
await api.favorite.toggle(userId, productId);
const isFavorited = await api.favorite.isFavorited(userId, productId);

// Notifications
const notifications = await api.notification.getByUser(userId);
await api.notification.markAsRead(notificationId);

// Statistics
const dashboardStats = await api.statistics.getDashboard(userId);
const adminStats = await api.statistics.getAdmin();
```

### Cách 2: Import Specific Modules

```javascript
import { authAPI, productAPI, orderAPI } from '@/api';

// Sử dụng trực tiếp
const products = await productAPI.getAll();
const loginResponse = await authAPI.login({ email, password });
const orders = await orderAPI.getByUser(userId);
```

### Cách 3: Import Individual Functions

```javascript
import { apiRequest, getAuthToken } from '@/api';

// Gọi custom endpoint
const customData = await apiRequest('/api/custom-endpoint', {
  method: 'POST',
  body: { data: 'value' }
});

// Lấy token hiện tại
const token = getAuthToken();
```

## 📚 Chi Tiết Các API Modules

### 1. Authentication API (authAPI)

```javascript
// Login
await api.auth.login({ email: 'user@example.com', password: '123456' });

// Register
await api.auth.register({
  email: 'user@example.com',
  password: '123456',
  fullName: 'John Doe',
  phone: '0123456789'
});

// Refresh Token
await api.auth.refreshToken();

// Forgot Password
await api.auth.forgotPassword('user@example.com');

// Reset Password
await api.auth.resetPassword(resetToken, newPassword);
```

### 2. User API (userAPI)

```javascript
// Get all users (Admin)
const users = await api.user.getAll();

// Get user by ID
const user = await api.user.getById(userId);

// Update user
await api.user.update(userId, { fullName: 'New Name' });

// Delete user
await api.user.delete(userId);
```

### 3. Product API (productAPI)

```javascript
// Get all products
const products = await api.product.getAll();

// Get product by ID
const product = await api.product.getById(productId);

// Get products by seller
const sellerProducts = await api.product.getBySeller(sellerId);

// Create product
const newProduct = await api.product.create({
  name: 'Tesla Model 3',
  price: 1000000000,
  description: 'Electric car',
  // ... other fields
});

// Update product
await api.product.update(productId, { price: 900000000 });

// Delete product
await api.product.delete(productId);

// Approve product (Admin)
await api.product.approve(productId);

// Reject product (Admin)
await api.product.reject(productId, 'Not meeting requirements');

// Product Images
const images = await api.product.images.getByProduct(productId);
await api.product.images.upload(formData);
await api.product.images.uploadMultiple(formData);
await api.product.images.delete(imageId);
```

### 4. Order API (orderAPI)

```javascript
// Get all orders
const orders = await api.order.getAll();

// Get order by ID
const order = await api.order.getById(orderId);

// Get orders by user
const userOrders = await api.order.getByUser(userId);

// Create order
const newOrder = await api.order.create({
  userId: 1,
  productId: 5,
  totalAmount: 1000000000,
  // ... other fields
});

// Update order status
await api.order.updateStatus(orderId, 'Confirmed');

// Cancel order
await api.order.cancel(orderId);
```

### 5. Payment API (paymentAPI)

```javascript
// Create payment
const payment = await api.payment.create({
  orderId: 1,
  amount: 1000000000,
  paymentMethod: 'VNPay'
});

// Get payment by ID
const payment = await api.payment.getById(paymentId);

// Get payments by user
const payments = await api.payment.getByUser(userId);

// Update payment status
await api.payment.updateStatus(paymentId, 'Completed');

// Process VNPay payment (auto redirect)
await api.payment.processVNPay({
  orderId: 1,
  amount: 1000000000
});
```

### 6. Favorite API (favoriteAPI)

```javascript
// Get user favorites
const favorites = await api.favorite.getByUser(userId);

// Add to favorites
await api.favorite.add(userId, productId);

// Remove from favorites
await api.favorite.remove(userId, productId);

// Toggle favorite
await api.favorite.toggle(userId, productId);

// Check if favorited
const isFavorited = await api.favorite.isFavorited(userId, productId);
```

### 7. Notification API (notificationAPI)

```javascript
// Get user notifications
const notifications = await api.notification.getByUser(userId);

// Mark as read
await api.notification.markAsRead(notificationId);

// Mark all as read
await api.notification.markAllAsRead(userId);

// Create notification
await api.notification.create({
  userId: 1,
  title: 'New Message',
  message: 'You have a new message',
  type: 'info'
});
```

### 8. Chat API (chatAPI)

```javascript
// Get chat history
const chatHistory = await api.chat.getHistory(userId);

// Get messages
const messages = await api.chat.getMessages(conversationId);

// Send message
await api.chat.sendMessage({
  conversationId: 1,
  senderId: 1,
  message: 'Hello!',
  messageType: 'text'
});

// Create conversation
const conversation = await api.chat.createConversation([userId1, userId2]);
```

### 9. Review API (reviewAPI)

```javascript
// Get product reviews
const reviews = await api.review.getByProduct(productId);

// Get user reviews
const userReviews = await api.review.getByUser(userId);

// Create review
await api.review.create({
  productId: 1,
  userId: 1,
  rating: 5,
  comment: 'Great product!'
});

// Update review
await api.review.update(reviewId, { rating: 4 });

// Delete review
await api.review.delete(reviewId);
```

### 10. Verification API (verificationAPI)

```javascript
// Get verification requests (Admin)
const requests = await api.verification.getRequests();

// Request verification for vehicle
await api.verification.request(productId);

// Update verification status (Admin)
await api.verification.updateStatus(
  productId, 
  'Completed', 
  'Vehicle verified successfully'
);
```

### 11. Statistics API (statisticsAPI)

```javascript
// Get dashboard stats
const dashboardStats = await api.statistics.getDashboard(userId);

// Get admin stats
const adminStats = await api.statistics.getAdmin();

// Get product stats
const productStats = await api.statistics.getProduct(productId);

// Get sales stats
const salesStats = await api.statistics.getSales(sellerId);
```

### 12. Search API (searchAPI)

```javascript
// Search products
const products = await api.search.products({
  keyword: 'Tesla',
  minPrice: 500000000,
  maxPrice: 2000000000,
  category: 'Electric',
  sortBy: 'price',
  sortOrder: 'asc'
});

// Search users
const users = await api.search.users({
  keyword: 'john'
});
```

### 13. Category API (categoryAPI)

```javascript
// Get all categories
const categories = await api.category.getAll();

// Get category by ID
const category = await api.category.getById(categoryId);

// Create category
await api.category.create({ name: 'SUV', description: 'Sport Utility Vehicles' });

// Update category
await api.category.update(categoryId, { name: 'Electric SUV' });

// Delete category
await api.category.delete(categoryId);
```

### 14. System API (systemAPI)

```javascript
// Health check
const health = await api.system.healthCheck();

// Get system info
const info = await api.system.getInfo();
```

## 🔧 Custom API Requests

Nếu cần gọi custom endpoint không có trong modules:

```javascript
import { apiRequest } from '@/api';

const data = await apiRequest('/api/custom-endpoint', {
  method: 'POST',
  body: {
    field1: 'value1',
    field2: 'value2'
  },
  headers: {
    'Custom-Header': 'value'
  }
});
```

## ⚙️ Tự Động Xử Lý

API Manager tự động xử lý:

1. **Authentication Token**: Tự động thêm Bearer token vào header
2. **Token Refresh**: Tự động refresh token khi hết hạn
3. **Error Handling**: Xử lý lỗi thống nhất với message tiếng Việt
4. **Content-Type**: Tự động set `application/json` hoặc `multipart/form-data`
5. **CORS**: Đã cấu hình đúng
6. **401 Redirect**: Tự động redirect về login khi unauthorized

## 🎯 Best Practices

### ✅ DO (Nên Làm)

```javascript
// 1. Sử dụng try-catch để xử lý lỗi
try {
  const products = await api.product.getAll();
  console.log(products);
} catch (error) {
  console.error('Failed to fetch products:', error.message);
  // Hiển thị thông báo lỗi cho user
}

// 2. Sử dụng async/await thay vì .then()
const handleLogin = async (credentials) => {
  try {
    const response = await api.auth.login(credentials);
    // Handle success
  } catch (error) {
    // Handle error
  }
};

// 3. Destructure response khi cần
const { data, total, page } = await api.product.getAll();
```

### ❌ DON'T (Không Nên)

```javascript
// 1. Không gọi API trong loop
for (let id of productIds) {
  await api.product.getById(id); // ❌ Slow!
}

// Thay vào đó, sử dụng Promise.all
const products = await Promise.all(
  productIds.map(id => api.product.getById(id))
);

// 2. Không hardcode base URL
fetch('http://localhost:5044/api/Product'); // ❌
api.product.getAll(); // ✅

// 3. Không tự xử lý token
fetch('/api/Product', {
  headers: { Authorization: `Bearer ${token}` } // ❌
});
api.product.getAll(); // ✅ Tự động thêm token
```

## 🔄 Migration từ Code Cũ

### Trước đây (nhiều file rải rác)

```javascript
import { apiRequest } from '../lib/api';
import apiService from '../services/apiService';
import productService from '../services/productService';

// Rất nhiều imports khác nhau
const products = await apiService.getAllProducts();
const product = await productService.getProductById(id);
```

### Bây giờ (một file duy nhất)

```javascript
import api from '@/api';

// Tất cả ở một nơi
const products = await api.product.getAll();
const product = await api.product.getById(id);
```

## 📝 Notes

- File cũ (`src/lib/api.js`, `src/services/*`) vẫn có thể dùng tạm thời
- Nên migrate dần sang `apiManager.js` để code đồng nhất
- Mọi API đều có JSDoc comments để IDE gợi ý tham số
- Token được quản lý tự động bởi `tokenManager`

## 🆘 Troubleshooting

### Lỗi 401 Unauthorized
- Token đã hết hạn → Sẽ tự động refresh
- Nếu refresh thất bại → Tự động redirect về `/login`

### Lỗi CORS
- Đảm bảo backend đã enable CORS
- Check `VITE_API_BASE` trong `.env`

### API không hoạt động
- Check console để xem request details
- Verify endpoint path đúng chưa
- Kiểm tra backend có running không

## 🔗 Related Files

- `src/api/apiManager.js` - Main API file
- `src/api/index.js` - Export module
- `src/lib/tokenManager.js` - Token management
- `src/config/api.js` - API configuration

