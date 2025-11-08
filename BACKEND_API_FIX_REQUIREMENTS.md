# 🔧 Yêu Cầu Sửa Backend API - OrderController.GetBuyerOrders

## 🚨 Vấn Đề Hiện Tại

Endpoint `/api/Order/buyer` (GET) **THIẾU** các trường quan trọng cần thiết cho frontend:

### ❌ Các Trường Đang Thiếu:

1. **`depositStatus`** - Trạng thái thanh toán cọc (Pending, Paid, Succeeded)
2. **`product` object đầy đủ** - Hiện chỉ có `productTitle`, thiếu `status`, `price`, `images`, etc.
3. **`buyerId` hoặc `userId`** - Để frontend có thể filter orders của buyer
4. **`cancellationReason`** - Lý do hủy đơn hàng (nếu có)

### ✅ Các Trường Đang Có (từ backend hiện tại):

- `orderId`
- `productId`
- `productTitle` (chỉ có title, không có object đầy đủ)
- `orderStatus` ✅
- `depositAmount`
- `totalAmount`
- `completedDate`
- `createdAt`
- `sellerId`, `sellerName`, `sellerEmail`, `sellerPhone`
- `hasRating`

---

## 📋 Yêu Cầu Sửa Backend

### File: `backend/Controllers/OrderController.cs`
### Method: `GetBuyerOrders()` (dòng 114-159)

### Cần Thêm Vào Response:

```csharp
[HttpGet("buyer")]
[Authorize]
public async Task<ActionResult<IEnumerable<object>>> GetBuyerOrders()
{
    try
    {
        // Get user ID from JWT token
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return Unauthorized(new { message = "Không thể xác định người dùng" });
        }

        var orders = await _context.Orders
            .Include(o => o.Product)
            .Include(o => o.Seller)
            .Include(o => o.User)
            .Where(o => o.UserId == userId)
            .Select(o => new
            {
                orderId = o.OrderId,
                buyerId = o.UserId,  // ✅ THÊM: Để frontend filter
                userId = o.UserId,   // ✅ THÊM: Alias cho buyerId
                productId = o.ProductId,
                
                // ✅ THÊM: Product object đầy đủ với status
                product = o.Product != null ? new
                {
                    productId = o.Product.ProductId,
                    id = o.Product.ProductId,
                    title = o.Product.Title,
                    price = o.Product.Price,
                    status = o.Product.Status,  // ✅ QUAN TRỌNG: Để check "Sold"
                    productType = o.Product.ProductType,
                    // Có thể thêm các field khác nếu cần
                } : null,
                
                productTitle = o.Product?.Title ?? "Unknown",
                productImages = new string[0],
                sellerId = o.SellerId ?? 0,
                sellerName = o.Seller?.FullName ?? "Unknown",
                sellerEmail = o.Seller?.Email ?? "Unknown",
                sellerPhone = o.Seller?.Phone ?? "Unknown",
                depositAmount = o.DepositAmount,
                totalAmount = o.TotalAmount,
                
                // ✅ THÊM: DepositStatus từ Payment table
                depositStatus = _context.Payments
                    .Where(p => p.OrderId == o.OrderId && p.PaymentType == "Deposit")
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => p.PaymentStatus)
                    .FirstOrDefault() ?? "Pending",
                
                orderStatus = o.OrderStatus,  // ✅ GIỮ NGUYÊN
                status = o.OrderStatus,        // ✅ THÊM: Alias cho orderStatus
                
                // ✅ THÊM: CancellationReason nếu có
                cancellationReason = o.CancellationReason,
                
                completedDate = o.CompletedDate ?? DateTime.MinValue,
                createdAt = o.CreatedAt,
                createdDate = o.CreatedAt,     // ✅ THÊM: Alias cho createdAt
                hasRating = _context.Ratings.Any(r => r.OrderId == o.OrderId)
            })
            .OrderByDescending(o => o.createdAt)
            .ToListAsync();

        return Ok(orders);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, $"Error getting buyer orders for user {userIdClaim?.Value}");
        return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách đơn hàng của người mua" });
    }
}
```

---

## 🔍 Các Thay Đổi Chi Tiết

### 1. Thêm `buyerId` và `userId`:
```csharp
buyerId = o.UserId,
userId = o.UserId,
```
**Lý do:** Frontend cần filter orders theo `buyerId` hoặc `userId`

### 2. Thêm `product` object đầy đủ:
```csharp
product = o.Product != null ? new
{
    productId = o.Product.ProductId,
    id = o.Product.ProductId,
    title = o.Product.Title,
    price = o.Product.Price,
    status = o.Product.Status,  // ✅ QUAN TRỌNG!
    productType = o.Product.ProductType,
} : null,
```
**Lý do:** Frontend cần `product.status` để check "Sold" và hiển thị đúng trạng thái

### 3. Thêm `depositStatus` từ Payment table:
```csharp
depositStatus = _context.Payments
    .Where(p => p.OrderId == o.OrderId && p.PaymentType == "Deposit")
    .OrderByDescending(p => p.CreatedAt)
    .Select(p => p.PaymentStatus)
    .FirstOrDefault() ?? "Pending",
```
**Lý do:** Frontend cần biết trạng thái thanh toán cọc (Pending, Paid, Succeeded) để hiển thị "Đang đặt cọc" hay "Đã đặt cọc"

### 4. Thêm `status` alias:
```csharp
orderStatus = o.OrderStatus,
status = o.OrderStatus,  // Alias
```
**Lý do:** Frontend đang check nhiều tên trường: `status`, `Status`, `orderStatus`, `OrderStatus`

### 5. Thêm `cancellationReason`:
```csharp
cancellationReason = o.CancellationReason,
```
**Lý do:** Frontend cần hiển thị lý do từ chối cho buyer

### 6. Thêm `createdDate` alias:
```csharp
createdAt = o.CreatedAt,
createdDate = o.CreatedAt,  // Alias
```
**Lý do:** Frontend đang check nhiều tên trường

---

## ⚠️ Lưu Ý Quan Trọng

1. **Payment Table:** Cần đảm bảo Payment table có:
   - `OrderId` (foreign key đến Orders)
   - `PaymentType` = "Deposit"
   - `PaymentStatus` (Pending, Paid, Succeeded)

2. **Order Model:** Cần đảm bảo Order model có:
   - `CancellationReason` field (nếu chưa có)

3. **Product Include:** Đã có `.Include(o => o.Product)` nên OK ✅

---

## 🧪 Test Cases

Sau khi sửa, test các trường hợp:

1. ✅ Order với status = "Pending" → Hiển thị trong "đơn mua" với badge "Đang đặt cọc"
2. ✅ Order với status = "Deposited" và depositStatus = "Succeeded" → Hiển thị "Đã đặt cọc"
3. ✅ Order với status = "Completed" và product.status = "Sold" → Hiển thị "Đã mua"
4. ✅ Order với status = "Cancelled" và có cancellationReason → Hiển thị "Đã bị từ chối" + lý do

---

## 📝 Tóm Tắt

**Vấn đề:** Backend API thiếu các trường cần thiết để frontend có thể:
- Filter orders đúng cách
- Hiển thị đúng trạng thái (đang đặt cọc, đã đặt cọc, đã mua, đã bị từ chối)
- Hiển thị lý do từ chối

**Giải pháp:** Thêm các trường vào response của `/api/Order/buyer` endpoint như đã nêu ở trên.



