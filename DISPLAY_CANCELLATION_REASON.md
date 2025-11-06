# ĐỀ XUẤT HIỂN THỊ CANCELLATION REASON

## 📋 Tổng quan
Khi admin dùng endpoint `admin-reject` để từ chối giao dịch, `CancellationReason` sẽ được lưu vào Order. Đây là các nơi nên hiển thị lý do từ chối và ai sẽ thấy được.

---

## 1. 👤 NGƯỜI MUA (BUYER)

### 1.1. Trang "Lịch sử mua hàng" (MyPurchases.jsx)
**Vị trí:** Hiển thị khi Order có Status = "Cancelled"

**UI đề xuất:**
```jsx
{order.status === 'Cancelled' && order.cancellationReason && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
    <div className="flex items-start space-x-2">
      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-semibold text-red-900 mb-1">Giao dịch đã bị hủy</h4>
        <p className="text-sm text-red-800">
          <span className="font-medium">Lý do:</span> {order.cancellationReason}
        </p>
        <p className="text-xs text-red-600 mt-1">
          Đơn hàng này đã bị admin hủy. Sản phẩm đã được trả về trang chủ.
        </p>
      </div>
    </div>
  </div>
)}
```

**Mục đích:**
- Buyer biết tại sao đơn hàng bị hủy
- Buyer hiểu rõ lý do để tránh lặp lại

---

### 1.2. Trang chi tiết đơn hàng (nếu có OrderDetail page)
**Vị trí:** Ở phần thông tin đơn hàng

**UI đề xuất:**
```jsx
{order.status === 'Cancelled' && (
  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
    <div className="flex items-center space-x-2 mb-2">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <h3 className="text-lg font-semibold text-red-900">Đơn hàng đã bị hủy</h3>
    </div>
    <div className="bg-white rounded p-3 mt-2">
      <p className="text-sm text-gray-700 mb-1">
        <span className="font-medium">Lý do từ chối:</span>
      </p>
      <p className="text-gray-900">{order.cancellationReason}</p>
    </div>
    <p className="text-xs text-gray-600 mt-2">
      Đơn hàng này đã bị admin hủy vào {formatDate(order.cancellationDate)}
    </p>
  </div>
)}
```

---

### 1.3. Notification/Email (Optional)
**Khi:** Admin reject order
**Nội dung:** 
```
"Đơn hàng #123 của bạn đã bị hủy
Lý do: [CancellationReason]
Sản phẩm đã được trả về trang chủ."
```

---

## 2. 🏪 NGƯỜI BÁN (SELLER)

### 2.1. Trang "Quản lý đơn hàng" (MySales page)
**Vị trí:** Hiển thị khi Order có Status = "Cancelled"

**UI đề xuất:**
```jsx
{order.status === 'Cancelled' && order.cancellationReason && (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
    <div className="flex items-start space-x-2">
      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-orange-900 mb-1">
          Đơn hàng đã bị admin hủy
        </p>
        <p className="text-xs text-orange-800">
          <span className="font-medium">Lý do:</span> {order.cancellationReason}
        </p>
        <p className="text-xs text-orange-600 mt-1">
          Sản phẩm đã được trả về trang chủ để bạn có thể bán lại.
        </p>
      </div>
    </div>
  </div>
)}
```

**Mục đích:**
- Seller biết tại sao đơn hàng bị hủy
- Seller có thể cải thiện để tránh bị hủy lần sau

---

### 2.2. Trang chi tiết sản phẩm (ProductDetail.jsx)
**Vị trí:** Nếu sản phẩm đã từng có Order bị cancel

**UI đề xuất:**
```jsx
{product.status === 'Active' && product.cancelledOrderReason && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
    <div className="flex items-start space-x-2">
      <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-semibold text-yellow-900 mb-1">
          Sản phẩm đã được trả về
        </h4>
        <p className="text-sm text-yellow-800">
          Sản phẩm này đã từng có giao dịch nhưng đã bị hủy:
        </p>
        <p className="text-sm font-medium text-yellow-900 mt-1">
          "{product.cancelledOrderReason}"
        </p>
        <p className="text-xs text-yellow-700 mt-2">
          Bạn có thể tiếp tục bán sản phẩm này.
        </p>
      </div>
    </div>
  </div>
)}
```

---

## 3. 👨‍💼 ADMIN

### 3.1. Admin Dashboard - Tab "Quản lý giao dịch"
**Vị trí:** Hiển thị lý do trong card sản phẩm đã bị reject

**UI đề xuất:**
```jsx
{product.status === 'Active' && product.cancellationReason && (
  <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
    <div className="flex items-start space-x-2">
      <XCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-700 mb-1">
          Đã bị hủy
        </p>
        <p className="text-xs text-gray-600">
          {product.cancellationReason}
        </p>
      </div>
    </div>
  </div>
)}
```

**Mục đích:**
- Admin xem lại lý do đã từ chối
- Giúp admin tracking và audit

---

### 3.2. Admin Dashboard - Danh sách đơn hàng bị hủy
**Vị trí:** Filter theo Status = "Cancelled"

**UI đề xuất:**
```jsx
// Trong danh sách orders
{orders.filter(o => o.status === 'Cancelled').map(order => (
  <div key={order.orderId} className="border border-red-200 rounded-lg p-4">
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className="font-semibold">Đơn hàng #{order.orderId}</h4>
        <p className="text-sm text-gray-600">Sản phẩm: {order.productTitle}</p>
      </div>
      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
        Đã hủy
      </span>
    </div>
    
    {order.cancellationReason && (
      <div className="mt-3 p-3 bg-red-50 rounded">
        <p className="text-xs font-medium text-red-900 mb-1">Lý do hủy:</p>
        <p className="text-sm text-red-800">{order.cancellationReason}</p>
      </div>
    )}
    
    <div className="mt-2 text-xs text-gray-500">
      Ngày hủy: {formatDate(order.updatedAt)}
    </div>
  </div>
))}
```

---

## 4. 📊 TỔNG KẾT - AI THẤY GÌ

| Người dùng | Nơi hiển thị | Mục đích |
|-----------|-------------|----------|
| **Buyer** | 1. Trang "Lịch sử mua hàng"<br>2. Chi tiết đơn hàng<br>3. Notification | Biết tại sao đơn hàng bị hủy |
| **Seller** | 1. Trang "Quản lý đơn hàng"<br>2. Chi tiết sản phẩm (nếu có) | Biết lý do để cải thiện |
| **Admin** | 1. Admin Dashboard<br>2. Danh sách đơn hàng bị hủy | Tracking và audit |

---

## 5. 🎨 UI/UX RECOMMENDATIONS

### 5.1. Màu sắc và Icon
- **Buyer:** Đỏ (XCircle, AlertCircle) - Thông báo quan trọng
- **Seller:** Cam/Vàng (AlertTriangle, Info) - Cảnh báo nhẹ
- **Admin:** Xám/Đỏ nhạt - Thông tin trung tính

### 5.2. Vị trí hiển thị
- ✅ Hiển thị ở đầu hoặc nổi bật khi Order Status = "Cancelled"
- ✅ Không làm che khuất thông tin quan trọng khác
- ✅ Có thể collapse/expand để tiết kiệm không gian

### 5.3. Nội dung
- ✅ Hiển thị đầy đủ lý do từ chối
- ✅ Có thể thêm thời gian hủy (nếu có)
- ✅ Có thể thêm thông tin về việc hoàn tiền (nếu có)

---

## 6. 📝 BACKEND CẦN CẬP NHẬT

### 6.1. API Response cần include CancellationReason

**GetMyPurchases (`/api/Order/buyer`):**
```csharp
.Select(o => new
{
    orderId = o.OrderId,
    // ... other fields
    cancellationReason = o.CancellationReason, // ✅ THÊM
    orderStatus = o.OrderStatus,
    // ...
})
```

**GetMySales (`/api/Order/seller`):**
```csharp
.Select(o => new
{
    orderId = o.OrderId,
    // ... other fields
    cancellationReason = o.CancellationReason, // ✅ THÊM
    orderStatus = o.OrderStatus,
    // ...
})
```

**GetOrderById (`/api/Order/{id}`):**
```csharp
var response = new
{
    // ... other fields
    cancellationReason = order.CancellationReason, // ✅ THÊM
    // ...
}
```

---

## 7. ✅ CHECKLIST IMPLEMENTATION

### Frontend:
- [ ] Thêm UI hiển thị CancellationReason trong MyPurchases.jsx
- [ ] Thêm UI hiển thị CancellationReason trong MySales page (nếu có)
- [ ] Thêm UI hiển thị CancellationReason trong Admin Dashboard
- [ ] Test hiển thị với Order Status = "Cancelled"

### Backend:
- [ ] Đảm bảo GetMyPurchases trả về CancellationReason
- [ ] Đảm bảo GetMySales trả về CancellationReason
- [ ] Đảm bảo GetOrderById trả về CancellationReason
- [ ] Đảm bảo GetAllOrders trả về CancellationReason (cho admin)

---

## 8. 💡 KẾT LUẬN

**Lý do từ chối nên hiển thị ở:**
1. ✅ **Buyer:** Trang lịch sử mua hàng → Hiểu tại sao đơn hàng bị hủy
2. ✅ **Seller:** Trang quản lý đơn hàng → Biết lý do để cải thiện
3. ✅ **Admin:** Dashboard → Tracking và audit

**Lợi ích:**
- ✅ Transparency - Minh bạch với buyer và seller
- ✅ Accountability - Admin có trách nhiệm giải trình
- ✅ Improvement - Seller có thể cải thiện dựa trên feedback

