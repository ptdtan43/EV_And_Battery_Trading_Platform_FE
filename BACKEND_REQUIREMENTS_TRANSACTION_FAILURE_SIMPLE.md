# BACKEND REQUIREMENTS - Transaction Failure Reason Feature (SIMPLIFIED)

## 📋 Tổng quan
Backend cần hỗ trợ tính năng lưu lý do khi admin đánh dấu giao dịch không thành công.

**Flow đơn giản:**
1. Admin click "Giao dịch không thành công" → Modal hiện ra để nhập lý do
2. Admin nhập lý do → Lưu vào `CancellationReason` trong bảng `Orders`
3. Sản phẩm VẪN ở trong danh sách quản lý giao dịch (status không đổi)
4. Khi xem chi tiết sản phẩm → Hiển thị `CancellationReason`

---

## 1. DATABASE SCHEMA

### 1.1. Trường đã có sẵn
- ✅ `CancellationReason` (nvarchar(500)) - Đã tồn tại trong bảng `Orders`
- ✅ Không cần thêm trường nào khác

---

## 2. API ENDPOINTS CẦN TẠO/CẬP NHẬT

### 2.1. API Endpoint: `PUT /api/Order/{orderId}`

**Mục đích:** Cập nhật Order với CancellationReason

**Request Body:**
```json
{
  // ... tất cả các field hiện có của Order
  "cancellationReason": "Người mua yêu cầu hủy: Người mua thay đổi ý định"
}
```

**Logic xử lý:**
1. ✅ Verify admin authentication (chỉ admin mới được update CancellationReason)
2. ✅ Validate OrderId tồn tại
3. ✅ Update `CancellationReason` field
4. ✅ **KHÔNG** thay đổi Order Status hoặc Product Status
5. ✅ Return success response

**Code example:**
```csharp
[HttpPut("{orderId}")]
[Authorize(Policy = "AdminOnly")]
public async Task<IActionResult> UpdateOrder(int orderId, [FromBody] OrderUpdateRequest request)
{
    try
    {
        // Verify admin
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int adminId))
            return Unauthorized(new { message = "Invalid authentication" });

        var userRole = User.FindFirst("roleId")?.Value ?? "";
        if (userRole != "1") // Assuming "1" is admin role
            return StatusCode(403, new { message = "Only administrators can update orders" });

        // Find order
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderId == orderId);
        
        if (order == null)
            return NotFound(new { message = "Order not found" });

        // Update cancellation reason only
        if (!string.IsNullOrWhiteSpace(request.CancellationReason))
        {
            order.CancellationReason = request.CancellationReason;
            order.UpdatedAt = DateTime.UtcNow; // If you have UpdatedAt field
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Cancellation reason đã được lưu",
            orderId = order.OrderId,
            cancellationReason = order.CancellationReason
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating order cancellation reason");
        return StatusCode(500, new { message = "Có lỗi xảy ra khi lưu lý do từ chối" });
    }
}
```

---

### 2.2. API Endpoint: `GET /api/Order/{orderId}`

**Cập nhật:** Đảm bảo response bao gồm `CancellationReason`

**Response:**
```json
{
  "orderId": 123,
  "productId": 456,
  "buyerId": 789,
  "status": "Deposited",
  "cancellationReason": "Người mua yêu cầu hủy: Người mua thay đổi ý định",
  // ... other fields
}
```

---

### 2.3. API Endpoint: `GET /api/Product/{productId}`

**Cập nhật:** Khi lấy product, nếu có Order liên quan với CancellationReason, có thể include vào response

**Response:**
```json
{
  "productId": 456,
  "title": "Tesla Model 3",
  "status": "Reserved",
  "order": {
    "orderId": 123,
    "cancellationReason": "Người mua yêu cầu hủy: Người mua thay đổi ý định"
  },
  // ... other fields
}
```

---

## 3. BUSINESS LOGIC RULES

### 3.1. Validation Rules
- ✅ Chỉ admin mới có thể cập nhật `CancellationReason`
- ✅ `CancellationReason` là optional (có thể NULL)
- ✅ **KHÔNG** thay đổi Order Status hoặc Product Status khi lưu CancellationReason
- ✅ Sản phẩm vẫn hiển thị trong danh sách quản lý giao dịch

### 3.2. State Transitions
```
KHÔNG CÓ thay đổi status!
Product Status: Reserved → Vẫn là Reserved (không đổi)
Order Status: Deposited → Vẫn là Deposited (không đổi)
```

---

## 4. FRONTEND INTEGRATION

### 4.1. Frontend sẽ gọi API như sau:

```javascript
// Tìm Order liên quan đến ProductId
const orders = await apiRequest("/api/Order");
const order = orders.find(o => o.productId === productId);

// Lưu CancellationReason
await apiRequest(`/api/Order/${order.orderId}`, {
  method: 'PUT',
  body: {
    ...fullOrder,
    cancellationReason: "Người mua yêu cầu hủy: Người mua thay đổi ý định"
  }
});
```

### 4.2. Frontend sẽ hiển thị CancellationReason khi:
- Xem chi tiết sản phẩm trong trang quản lý giao dịch
- Xem chi tiết đơn hàng

---

## 5. EXAMPLE VALUES

**CancellationReason format:**
- `"Người mua yêu cầu hủy"`
- `"Người mua yêu cầu hủy: Người mua thay đổi ý định"`
- `"Thanh toán thất bại: Thẻ bị từ chối"`
- `"Sản phẩm không đúng mô tả: Xe có vết xước không được mô tả"`

---

## 6. TESTING CHECKLIST

- [ ] Test API với admin role - should succeed
- [ ] Test API với user role - should return 403
- [ ] Test với OrderId không tồn tại - should return NotFound
- [ ] Test update CancellationReason - should save correctly
- [ ] Test verify Order status KHÔNG thay đổi
- [ ] Test verify Product status KHÔNG thay đổi
- [ ] Test GET Order API returns CancellationReason
- [ ] Test GET Product API có thể include CancellationReason từ Order

---

## 7. SUMMARY

**Những gì backend cần làm:**
1. ✅ Đảm bảo API `PUT /api/Order/{orderId}` có thể update `CancellationReason`
2. ✅ Đảm bảo API `GET /api/Order/{orderId}` trả về `CancellationReason`
3. ✅ (Optional) API `GET /api/Product/{productId}` có thể include `CancellationReason` từ Order liên quan
4. ✅ Validate chỉ admin mới được update CancellationReason
5. ✅ **KHÔNG** thay đổi Order Status hoặc Product Status

**Frontend đã làm:**
- ✅ UI modal để admin nhập lý do
- ✅ Validation form
- ✅ Gọi API PUT để update Order với CancellationReason
- ✅ Hiển thị CancellationReason khi xem chi tiết

---

## 8. NOTES

- Sản phẩm **KHÔNG** bị trả về Homepage (status vẫn là Reserved/Sold)
- Sản phẩm **VẪN** hiển thị trong danh sách quản lý giao dịch
- Chỉ cần lưu lý do để admin/user xem lại sau này
- Không có logic refund hoặc thay đổi trạng thái phức tạp

