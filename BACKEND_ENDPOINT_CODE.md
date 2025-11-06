# BACKEND CODE - Endpoint Update Cancellation Reason

## 📝 Hướng dẫn thêm code vào OrderController.cs

### 1. Thêm endpoint vào OrderController class

**Vị trí:** Sau endpoint `[HttpPost("{id}/admin-reject")]` và trước dấu đóng ngoặc nhọn cuối cùng của class `OrderController`

```csharp
/// <summary>
/// Admin cập nhật lý do từ chối giao dịch
/// Chỉ lưu CancellationReason, KHÔNG thay đổi Order Status hoặc Product Status
/// </summary>
[HttpPut("{id}/cancellation-reason")]
[Authorize(Policy = "AdminOnly")]
public ActionResult UpdateCancellationReason(int id, [FromBody] UpdateCancellationReasonRequest request)
{
    try
    {
        // Validate request
        if (request == null || string.IsNullOrWhiteSpace(request.CancellationReason))
        {
            return BadRequest(new { message = "CancellationReason is required." });
        }

        // Find order
        var order = _orderRepo.GetOrderById(id);
        if (order == null)
        {
            return NotFound(new { message = "Order not found." });
        }

        // Verify admin
        var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        if (userId <= 0)
        {
            return Unauthorized(new { message = "Invalid user token." });
        }

        // Check if user is admin (roleId = 1)
        var userRole = User.FindFirst("roleId")?.Value ?? "";
        if (userRole != "1")
        {
            return StatusCode(403, new { message = "Only administrators can update cancellation reason." });
        }

        // ✅ CHỈ update CancellationReason - KHÔNG thay đổi Status
        order.CancellationReason = request.CancellationReason;
        
        // Update timestamp if you have UpdatedAt field (uncomment if needed)
        // order.UpdatedAt = DateTime.UtcNow;
        
        var updatedOrder = _orderRepo.UpdateOrder(order);

        // Return success response
        return Ok(new
        {
            success = true,
            message = "Cancellation reason đã được lưu thành công",
            orderId = updatedOrder.OrderId,
            cancellationReason = updatedOrder.CancellationReason,
            status = updatedOrder.Status, // Status remains unchanged
            note = "Order status và Product status không thay đổi"
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Internal server error: " + ex.Message });
    }
}
```

---

### 2. Thêm DTO class

**Vị trí:** Sau dấu đóng ngoặc nhọn cuối cùng của class `OrderController`, trước dấu đóng ngoặc nhọn cuối cùng của namespace

```csharp
// DTO cho Update Cancellation Reason
public class UpdateCancellationReasonRequest
{
    public string CancellationReason { get; set; } = string.Empty;
}
```

---

### 3. Cập nhật GetOrderById để include CancellationReason

**Đảm bảo endpoint `GetOrderById` trả về `CancellationReason`:**

Hiện tại code của bạn đã có `CancellationReason` trong `GetAllOrders`, nhưng trong `GetOrderById` chưa có. Hãy thêm vào:

```csharp
[HttpGet("{id}")]
public ActionResult GetOrderById(int id)
{
    try
    {
        var order = _orderRepo.GetOrderById(id);
        if (order == null)
        {
            return NotFound();
        }

        // Verify if user has access to this order
        var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        if (order.BuyerId != userId && order.SellerId != userId && !User.IsInRole("1"))
        {
            return Forbid();
        }

        var response = new
        {
            order.OrderId,
            order.TotalAmount,
            order.DepositAmount,
            order.Status,
            order.DepositStatus,
            order.FinalPaymentStatus,
            order.PayoutAmount,
            order.PayoutStatus,
            order.CreatedDate,
            order.CompletedDate,
            order.CancellationReason, // ✅ THÊM DÒNG NÀY
            BuyerName = order.Buyer?.FullName,
            SellerName = order.Seller?.FullName,
            Product = new
            {
                order.Product?.Title,
                order.Product?.Price
            },
            Payments = order.Payments?.Select(p => new
            {
                p.PaymentId,
                p.Amount,
                p.PaymentType,
                p.Status,
                p.CreatedDate
            })
        };

        return Ok(response);
    }
    catch (Exception ex)
    {
        return StatusCode(500, "Internal server error: " + ex.Message);
    }
}
```

---

## ✅ Checklist

- [ ] Thêm endpoint `[HttpPut("{id}/cancellation-reason")]` vào OrderController
- [ ] Thêm DTO class `UpdateCancellationReasonRequest`
- [ ] Đảm bảo `GetOrderById` trả về `CancellationReason`
- [ ] Test endpoint với admin role
- [ ] Test endpoint với non-admin role (should return 403)
- [ ] Verify Order Status KHÔNG thay đổi sau khi update CancellationReason
- [ ] Verify Product Status KHÔNG thay đổi sau khi update CancellationReason

---

## 📋 API Specification

**Endpoint:** `PUT /api/Order/{id}/cancellation-reason`

**Authorization:** AdminOnly

**Request Body:**
```json
{
  "cancellationReason": "Người mua yêu cầu hủy: Người mua thay đổi ý định"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Cancellation reason đã được lưu thành công",
  "orderId": 123,
  "cancellationReason": "Người mua yêu cầu hủy: Người mua thay đổi ý định",
  "status": "Deposited",
  "note": "Order status và Product status không thay đổi"
}
```

**Response (Error):**
```json
{
  "message": "CancellationReason is required."
}
```

---

## 🔍 Lưu ý quan trọng

1. ✅ **KHÔNG** thay đổi `Order.Status`
2. ✅ **KHÔNG** thay đổi `Product.Status`
3. ✅ Chỉ update `CancellationReason`
4. ✅ Chỉ admin mới được phép gọi endpoint này
5. ✅ Product vẫn ở trong danh sách quản lý giao dịch

