# BACKEND REQUIREMENTS - Transaction Failure Reason Feature

## 📋 Tổng quan
Backend cần hỗ trợ tính năng lưu lý do khi admin đánh dấu giao dịch không thành công, để có audit trail và thông báo cho người mua/người bán.

---

## 1. DATABASE SCHEMA CHANGES

### 1.1. Thêm các cột vào bảng `Orders`

**Lưu ý:** Bảng `Orders` đã có sẵn trường `CancellationReason` (nvarchar(500)) để lưu text lý do.

**Chỉ cần thêm các cột metadata:**

```sql
-- Thêm các cột mới vào bảng Orders
ALTER TABLE [Orders]
ADD [TransactionFailureReasonCode] nvarchar(50) NULL,          -- Mã lý do để query/thống kê
    [TransactionFailureDate] datetime2 NULL,                   -- Thời điểm admin đánh dấu thất bại
    [TransactionFailedBy] int NULL;                            -- AdminId who marked as failed

-- Foreign key cho TransactionFailedBy
ALTER TABLE [Orders]
ADD CONSTRAINT [FK_Orders_Users_TransactionFailedBy] 
    FOREIGN KEY ([TransactionFailedBy]) REFERENCES [Users] ([UserId]);

-- Add indexes for better query performance
CREATE INDEX [IX_Orders_TransactionFailedBy] ON [Orders] ([TransactionFailedBy]);
CREATE INDEX [IX_Orders_TransactionFailureDate] ON [Orders] ([TransactionFailureDate]);
CREATE INDEX [IX_Orders_TransactionFailureReasonCode] ON [Orders] ([TransactionFailureReasonCode]);
```

**Giải thích các field:**
- `CancellationReason` (đã có sẵn): Lưu text lý do kết hợp từ ReasonCode + ReasonNote
- `TransactionFailureReasonCode`: Mã lý do (BUYER_REQUEST, SELLER_CANCEL, PAYMENT_FAILED, etc.) - để query/thống kê
- `TransactionFailureDate`: Thời điểm admin đánh dấu thất bại
- `TransactionFailedBy`: ID của admin đã đánh dấu thất bại

**Cách sử dụng:**
- Frontend gửi: `ReasonCode` + `ReasonNote`
- Backend combine: `CancellationReason` = "Người mua yêu cầu hủy: Người mua thay đổi ý định"
- Backend lưu riêng: `TransactionFailureReasonCode` = "BUYER_REQUEST" (để query)

### 1.2. (Optional) Tạo bảng `TransactionHistory` để tracking

```sql
CREATE TABLE [TransactionHistory] (
    [HistoryId] int NOT NULL IDENTITY,
    [OrderId] int NULL,
    [ProductId] int NULL,
    [StatusFrom] nvarchar(20) NULL,
    [StatusTo] nvarchar(20) NULL,
    [ChangedBy] int NULL, -- UserId who made the change
    [ReasonCode] nvarchar(50) NULL,
    [ReasonNote] nvarchar(1000) NULL,
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__TransactionHistory] PRIMARY KEY ([HistoryId]),
    CONSTRAINT [FK_TransactionHistory_Orders_OrderId] 
        FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([OrderId]),
    CONSTRAINT [FK_TransactionHistory_Products_ProductId] 
        FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
    CONSTRAINT [FK_TransactionHistory_Users_ChangedBy] 
        FOREIGN KEY ([ChangedBy]) REFERENCES [Users] ([UserId])
);
```

---

## 2. API ENDPOINTS CẦN TẠO/CẬP NHẬT

### 2.1. API Endpoint: `POST /api/payment/admin-fail-transaction`

**Mục đích:** Admin đánh dấu giao dịch không thành công và lưu lý do

**Request Body:**
```json
{
  "ProductId": 123,
  "ReasonCode": "BUYER_REQUEST", // hoặc "SELLER_CANCEL", "PAYMENT_FAILED", etc.
  "ReasonNote": "Người mua yêu cầu hủy do thay đổi ý định"
}
```

**Request DTO:**
```csharp
public class AdminFailTransactionRequest
{
    public int ProductId { get; set; }
    public string ReasonCode { get; set; } // BUYER_REQUEST, SELLER_CANCEL, PAYMENT_FAILED, etc.
    public string ReasonNote { get; set; } // Optional note
}
```

**Response:**
```json
{
  "success": true,
  "message": "Giao dịch đã được đánh dấu không thành công",
  "orderId": 456,
  "productId": 123,
  "failureReason": "Người mua yêu cầu hủy do thay đổi ý định",
  "refundAmount": 5000000
}
```

**Logic xử lý:**
1. ✅ Verify admin authentication và authorization
2. ✅ Validate ProductId và tìm Product với status = "Reserved"
3. ✅ Tìm Order liên quan đến ProductId này với status = "Deposited"
4. ✅ Cập nhật Order:
   - Set `Status` = "Cancelled" hoặc "Failed"
   - Set `TransactionFailureReasonCode` = request.ReasonCode
   - Set `CancellationReason` = BuildFailureReasonText(request.ReasonCode, request.ReasonNote)
   - Set `TransactionFailureDate` = DateTime.UtcNow
   - Set `TransactionFailedBy` = adminId
5. ✅ Cập nhật Product:
   - Set `Status` = "Active" (để trả về homepage)
   - Set `UpdatedAt` = DateTime.UtcNow
6. ✅ (Optional) Tạo record trong TransactionHistory
7. ✅ Tính toán refund amount từ DepositAmount trong Order
8. ✅ Return response với thông tin refund

**Code structure gợi ý:**
```csharp
[HttpPost("admin-fail-transaction")]
[Authorize(Policy = "AdminOnly")]
public async Task<IActionResult> AdminFailTransaction([FromBody] AdminFailTransactionRequest request)
{
    try
    {
        // 1. Verify admin
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int adminId))
            return Unauthorized(new { message = "Invalid authentication" });

        var userRole = User.FindFirst("roleId")?.Value ?? "";
        if (userRole != "1") // Assuming "1" is admin role
            return StatusCode(403, new { message = "Only administrators can fail transactions" });

        // 2. Validate request
        if (request == null || request.ProductId <= 0)
            return BadRequest(new { message = "Invalid request data" });

        // 3. Find product
        var product = await _context.Products
            .Include(p => p.Seller)
            .FirstOrDefaultAsync(p => p.ProductId == request.ProductId);
        
        if (product == null)
            return NotFound(new { message = "Product not found" });

        if (product.Status?.ToLower() != "reserved")
            return BadRequest(new { message = $"Product must be in 'Reserved' status. Current status: {product.Status}" });

        // 4. Find order
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.ProductId == request.ProductId && 
                (o.Status == "Deposited" || o.Status == "Pending"));
        
        if (order == null)
            return NotFound(new { message = "Order not found for this product" });

        // 5. Update order
        order.Status = "Cancelled"; // hoặc "Failed" tùy convention của bạn
        order.TransactionFailureReasonCode = request.ReasonCode;
        order.CancellationReason = BuildFailureReasonText(request.ReasonCode, request.ReasonNote); // Combine text
        order.TransactionFailureDate = DateTime.UtcNow;
        order.TransactionFailedBy = adminId;
        order.UpdatedAt = DateTime.UtcNow;

        // 6. Update product
        product.Status = "Active";
        product.UpdatedAt = DateTime.UtcNow;

        // 7. (Optional) Create transaction history
        // _context.TransactionHistory.Add(...);

        // 8. Save changes
        await _context.SaveChangesAsync();

        // 9. Build failure reason text for response
        var reasonText = BuildFailureReasonText(request.ReasonCode, request.ReasonNote);

        // 10. Log action
        _logger.LogInformation($"Admin {adminId} marked transaction as failed for product {request.ProductId}. Reason: {request.ReasonCode}");

        return Ok(new
        {
            success = true,
            message = "Giao dịch đã được đánh dấu không thành công",
            orderId = order.OrderId,
            productId = product.ProductId,
            failureReason = reasonText,
            refundAmount = order.DepositAmount
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error failing transaction");
        return StatusCode(500, new { message = "Có lỗi xảy ra khi đánh dấu giao dịch thất bại" });
    }
}

private string BuildFailureReasonText(string reasonCode, string reasonNote)
{
    var reasonMap = new Dictionary<string, string>
    {
        { "BUYER_REQUEST", "Người mua yêu cầu hủy" },
        { "SELLER_CANCEL", "Người bán hủy giao dịch" },
        { "PAYMENT_FAILED", "Thanh toán thất bại" },
        { "PRODUCT_DAMAGED", "Sản phẩm bị hư hỏng" },
        { "MISMATCH_DESCRIPTION", "Sản phẩm không đúng mô tả" },
        { "FRAUD_SUSPECT", "Nghi ngờ gian lận" },
        { "OUT_OF_STOCK", "Sản phẩm không còn hàng" },
        { "PRICE_DISPUTE", "Tranh chấp về giá" },
        { "DELIVERY_ISSUE", "Vấn đề giao hàng" },
        { "OTHER", "Lý do khác" }
    };

    var reasonLabel = reasonMap.ContainsKey(reasonCode) ? reasonMap[reasonCode] : reasonCode;
    
    if (!string.IsNullOrWhiteSpace(reasonNote))
    {
        return reasonCode == "OTHER" ? reasonNote : $"{reasonLabel}: {reasonNote}";
    }
    
    return reasonLabel;
}
```

---

### 2.2. API Endpoint: `GET /api/order/{orderId}/failure-reason`

**Mục đích:** Lấy thông tin lý do giao dịch thất bại (cho buyer/seller xem)

**Response:**
```json
{
  "orderId": 456,
  "productId": 123,
  "reasonCode": "BUYER_REQUEST",
  "reasonNote": "Người mua yêu cầu hủy do thay đổi ý định",
  "failureReason": "Người mua yêu cầu hủy: Người mua yêu cầu hủy do thay đổi ý định",
  "failedDate": "2024-01-15T10:30:00Z",
  "failedBy": {
    "userId": 1,
    "fullName": "Admin User"
  }
}
```

---

### 2.3. Cập nhật API hiện có: `GET /api/Order/{orderId}`

**Thêm các field mới vào response:**
- `transactionFailureReasonCode`
- `transactionFailureReasonNote`
- `transactionFailureDate`
- `transactionFailedBy`

---

## 3. BUSINESS LOGIC RULES

### 3.1. Validation Rules
- ✅ Chỉ admin mới có thể đánh dấu transaction failed
- ✅ Chỉ Product có status = "Reserved" mới có thể được đánh dấu failed
- ✅ Chỉ Order có status = "Deposited" hoặc "Pending" mới có thể được đánh dấu failed
- ✅ ReasonCode là bắt buộc
- ✅ Nếu ReasonCode = "OTHER", thì ReasonNote phải có (min length > 0)

### 3.2. State Transitions
```
Product Status: Reserved → Active
Order Status: Deposited/Pending → Cancelled/Failed
```

### 3.3. Refund Logic
- Refund amount = `Order.DepositAmount`
- Backend có thể cần tích hợp với payment gateway để thực hiện refund thực tế
- Hiện tại frontend chỉ lưu thông tin vào localStorage để hiển thị banner

---

## 4. NOTIFICATION (Optional nhưng nên có)

### 4.1. Gửi notification cho Buyer
- Thông báo giao dịch đã bị hủy
- Hiển thị lý do và số tiền sẽ được hoàn lại

### 4.2. Gửi notification cho Seller
- Thông báo giao dịch đã bị admin hủy
- Hiển thị lý do

---

## 5. FRONTEND INTEGRATION

### 5.1. Frontend sẽ gọi API như sau:

```javascript
// Trong handleMarkTransactionFailed function
await apiRequest(`/api/payment/admin-fail-transaction`, {
  method: 'POST',
  body: {
    ProductId: productId,
    ReasonCode: failureReason.reasonCode,
    ReasonNote: failureReason.reasonNote
  }
});
```

### 5.2. Frontend sẽ nhận response và:
- Lưu `failureReason` vào localStorage để hiển thị banner cho buyer
- Reload data để cập nhật UI
- Hiển thị toast notification

---

## 6. DATABASE MIGRATION SCRIPT

```sql
-- Migration: Add Transaction Failure Reason Fields to Orders Table
-- Date: 2024-01-XX
-- Author: Backend Team
-- Note: CancellationReason already exists in database, we're adding metadata fields

BEGIN TRANSACTION;

-- Add new columns (CancellationReason already exists)
ALTER TABLE [Orders]
ADD [TransactionFailureReasonCode] nvarchar(50) NULL,
    [TransactionFailureDate] datetime2 NULL,
    [TransactionFailedBy] int NULL;

-- Add foreign key constraint
ALTER TABLE [Orders]
ADD CONSTRAINT [FK_Orders_Users_TransactionFailedBy] 
    FOREIGN KEY ([TransactionFailedBy]) REFERENCES [Users] ([UserId]);

-- Add indexes for better query performance
CREATE INDEX [IX_Orders_TransactionFailedBy] ON [Orders] ([TransactionFailedBy]);
CREATE INDEX [IX_Orders_TransactionFailureDate] ON [Orders] ([TransactionFailureDate]);
CREATE INDEX [IX_Orders_TransactionFailureReasonCode] ON [Orders] ([TransactionFailureReasonCode]);

COMMIT TRANSACTION;
```

---

## 7. TESTING CHECKLIST

- [ ] Test API với admin role - should succeed
- [ ] Test API với user role - should return 403
- [ ] Test với Product status != "Reserved" - should return BadRequest
- [ ] Test với ProductId không tồn tại - should return NotFound
- [ ] Test với ReasonCode = "OTHER" và ReasonNote = "" - should return BadRequest
- [ ] Test với ReasonCode hợp lệ - should update Order và Product correctly
- [ ] Test verify Order status được update đúng
- [ ] Test verify Product status được update thành "Active"
- [ ] Test verify các field lý do được lưu đúng vào database
- [ ] Test GET API để retrieve failure reason

---

## 8. SUMMARY

**Những gì backend cần làm:**
1. ✅ Thêm 3 columns vào bảng Orders (ReasonCode, Date, FailedBy) - CancellationReason đã có sẵn
2. ✅ Tạo API endpoint `POST /api/payment/admin-fail-transaction`
3. ✅ Implement logic validate và update Order/Product
   - Combine ReasonCode + ReasonNote → lưu vào CancellationReason
   - Lưu ReasonCode riêng vào TransactionFailureReasonCode để query
4. ✅ (Optional) Tạo API GET để retrieve failure reason
5. ✅ (Optional) Gửi notification cho buyer/seller

**Frontend đã làm:**
- ✅ UI modal để admin nhập lý do
- ✅ Validation form
- ✅ Gọi API endpoint (đang chờ backend implement)
- ✅ Hiển thị thông báo cho user

---

## 9. EXAMPLE VALUES

**ReasonCode values:**
- `BUYER_REQUEST`
- `SELLER_CANCEL`
- `PAYMENT_FAILED`
- `PRODUCT_DAMAGED`
- `MISMATCH_DESCRIPTION`
- `FRAUD_SUSPECT`
- `OUT_OF_STOCK`
- `PRICE_DISPUTE`
- `DELIVERY_ISSUE`
- `OTHER`

---

## 10. CONTACT

Nếu có thắc mắc về implementation, vui lòng liên hệ Frontend team hoặc xem code trong:
- `src/pages/AdminDashboard.jsx` - function `handleMarkTransactionFailed`
- `src/pages/AdminDashboard.jsx` - state `transactionFailureReasons`

