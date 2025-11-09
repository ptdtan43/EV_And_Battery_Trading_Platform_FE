# 🔧 Sửa Backend Endpoint `/api/Order/seller` (GetMySales)

## 🚨 Vấn Đề Hiện Tại

Endpoint `GetMySales()` **THIẾU** các trường quan trọng cần thiết cho frontend:

### ❌ Các Trường Đang Thiếu:

1. **`ProductId`** - Cần để frontend fetch product details và images
2. **`Product.Status`** - Cần để check "Sold" và hiển thị badge "Đã bán"
3. **`CompletedDate`** - Cần để hiển thị ngày hoàn tất
4. **`DepositStatus`** - Có thể cần để hiển thị trạng thái đặt cọc

### ✅ Các Trường Đang Có:

- `OrderId`
- `TotalAmount`
- `Status` (OrderStatus)
- `PayoutStatus`
- `CreatedDate`
- `CancellationReason`
- `CancelledDate`
- `BuyerName`
- `Product` (chỉ có `Title` và `Price`)

---

## 📋 Yêu Cầu Sửa Backend

### File: `BE.API.Controllers.OrderController.cs`
### Method: `GetMySales()` (dòng ~430-450)

### Sửa Đổi:

**TRƯỚC:**
```csharp
[HttpGet("seller")]
[Authorize(Policy = "MemberOnly")]
public ActionResult GetMySales()
{
    try
    {
        var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var orders = _orderRepo.GetOrdersBySellerId(userId);

        var response = orders.Select(o => new
        {
            o.OrderId,
            o.TotalAmount,
            o.Status,
            o.PayoutStatus,
            o.CreatedDate,
            o.CancellationReason,
            o.CancelledDate,
            BuyerName = o.Buyer?.FullName,
            Product = new
            {
                o.Product?.Title,
                o.Product?.Price
            }
        }).ToList();

        return Ok(response);
    }
    catch (Exception ex)
    {
        return StatusCode(500, "Internal server error: " + ex.Message);
    }
}
```

**SAU (Sửa thành):**
```csharp
[HttpGet("seller")]
[Authorize(Policy = "MemberOnly")]
public ActionResult GetMySales()
{
    try
    {
        var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
        var orders = _orderRepo.GetOrdersBySellerId(userId);

        var response = orders.Select(o => new
        {
            o.OrderId,
            ProductId = o.ProductId,  // ✅ THÊM: Cần để fetch product details
            o.TotalAmount,
            o.DepositAmount,  // ✅ THÊM: Có thể cần
            o.Status,
            OrderStatus = o.Status,  // ✅ THÊM: Alias cho frontend compatibility
            o.DepositStatus,  // ✅ THÊM: Cần để check trạng thái đặt cọc
            o.PayoutStatus,
            o.CreatedDate,
            o.CompletedDate,  // ✅ THÊM: Cần để hiển thị ngày hoàn tất
            o.CancellationReason,
            o.CancelledDate,
            BuyerName = o.Buyer?.FullName,
            BuyerId = o.BuyerId,  // ✅ THÊM: Có thể cần
            Product = o.Product != null ? new
            {
                ProductId = o.Product.ProductId,  // ✅ THÊM: Cần để fetch images
                o.Product.Title,
                o.Product.Price,
                Status = o.Product.Status,  // ✅ QUAN TRỌNG: Cần để check "Sold"
                ProductType = o.Product.ProductType ?? string.Empty,
                Brand = o.Product.Brand ?? string.Empty,
                Model = o.Product.Model,
                Condition = o.Product.Condition,
                VehicleType = o.Product.VehicleType,
                LicensePlate = o.Product.LicensePlate,
                ImageData = o.Product.ProductImages?.FirstOrDefault()?.ImageData  // ✅ THÊM: Get first image
            } : new
            {
                ProductId = (int?)null,
                Title = "Sản phẩm không tìm thấy",
                Price = o.TotalAmount,
                Status = (string?)"Unknown",
                ProductType = string.Empty,
                Brand = string.Empty,
                Model = (string?)null,
                Condition = (string?)null,
                VehicleType = (string?)null,
                LicensePlate = (string?)null,
                ImageData = (string?)null
            }
        }).ToList();

        return Ok(response);
    }
    catch (Exception ex)
    {
        return StatusCode(500, "Internal server error: " + ex.Message);
    }
}
```

---

## 🔍 Các Thay Đổi Chi Tiết

### 1. Thêm `ProductId`:
```csharp
ProductId = o.ProductId,
```
**Lý do:** Frontend cần ProductId để fetch product details và images

### 2. Thêm `Product.Status`:
```csharp
Status = o.Product.Status,  // ✅ QUAN TRỌNG!
```
**Lý do:** Frontend cần check `product.status === 'sold'` để hiển thị badge "Đã bán"

### 3. Thêm `CompletedDate`:
```csharp
o.CompletedDate,
```
**Lý do:** Frontend cần hiển thị ngày hoàn tất cho orders đã completed

### 4. Thêm `DepositStatus`:
```csharp
o.DepositStatus,
```
**Lý do:** Frontend cần check trạng thái đặt cọc để hiển thị badge "Đã được đặt cọc"

### 5. Thêm `ProductId` trong Product object:
```csharp
ProductId = o.Product.ProductId,
```
**Lý do:** Frontend cần ProductId để fetch images từ `/api/ProductImage/product/{productId}`

### 6. Thêm các field khác trong Product:
```csharp
ProductType, Brand, Model, Condition, VehicleType, LicensePlate, ImageData
```
**Lý do:** Để frontend có đầy đủ thông tin product mà không cần fetch thêm

---

## ✅ Kiểm Tra Sau Khi Sửa

1. Test trên Swagger:
   - Gọi `GET /api/Order/seller`
   - Kiểm tra response có đầy đủ các field:
     - ✅ `ProductId`
     - ✅ `Product.Status`
     - ✅ `CompletedDate`
     - ✅ `DepositStatus`
     - ✅ `Product.ProductId`
     - ✅ `Product.ImageData`

2. Test frontend:
   - Mở "Đơn bán" trong MyPurchases
   - Kiểm tra:
     - ✅ Orders hiển thị đầy đủ
     - ✅ Badge "Đã bán" hiển thị đúng cho orders completed
     - ✅ Giá tiền và ngày tạo hiển thị đúng
     - ✅ Product images hiển thị đúng

---

## 📝 Lưu Ý

- Đảm bảo `Order` model có các field: `ProductId`, `DepositStatus`, `CompletedDate`
- Đảm bảo `Product` model có các field: `Status`, `ProductType`, `Brand`, `Model`, etc.
- Đảm bảo `ProductImages` được include trong query (nếu dùng Entity Framework)

---

## 🎯 Kết Quả Mong Đợi

Sau khi sửa:
- ✅ Frontend có đầy đủ thông tin để hiển thị orders
- ✅ Không cần fetch thêm product details (trừ khi cần update)
- ✅ Badge "Đã bán" hiển thị đúng cho orders completed
- ✅ Product images hiển thị đúng
- ✅ Giá tiền và ngày tạo hiển thị đúng

