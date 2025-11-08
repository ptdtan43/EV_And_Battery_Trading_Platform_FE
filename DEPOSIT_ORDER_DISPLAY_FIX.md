# 🔧 Fix: Đơn Hàng Đã Đặt Cọc Không Hiển Thị Trong "Đơn Mua"

## 🚨 Vấn Đề

Sau khi buyer đặt cọc thành công:
- ✅ Đơn hàng đã được đưa về "quản lý giao dịch" (admin dashboard)
- ❌ Đơn hàng **KHÔNG hiển thị** trong "đơn mua" của buyer

## 🔍 Nguyên Nhân

Từ code backend `PaymentController.cs` (line 158-181), sau khi payment callback thành công:

```csharp
if (isSuccess)
{
    payment.PaymentStatus = "Succeeded";
    
    // ✅ Product status được update
    if (payment.PaymentType == "Deposit")
    {
        product.Status = "Reserved";  // ✅ Được update
    }
    
    // ❌ Order.Status KHÔNG được update (vẫn là "Pending")
    // ❌ Order.DepositStatus KHÔNG được update (vẫn là "Unpaid")
}
```

**Vấn đề:** Backend chỉ update `Product.Status = "Reserved"` nhưng **KHÔNG update** `Order.Status` và `Order.DepositStatus`.

### Frontend Filter Logic (Trước Khi Sửa):

```javascript
const isDeposited = orderStatus === 'deposited' || 
                   orderStatus === 'depositpaid' || 
                   depositStatus === 'paid' ||
                   depositStatus === 'succeeded';
```

**Kết quả:** Order với `Status = "Pending"` và `DepositStatus = "Unpaid"` nhưng `Product.Status = "Reserved"` → **KHÔNG match** với `isDeposited` → **KHÔNG hiển thị** trong "đơn mua"

## ✅ Giải Pháp

### Frontend Fix (Đã Áp Dụng):

Thêm check `Product.Status = "Reserved"` vào logic `isDeposited`:

```javascript
// Show orders that have been successfully deposited (đã đặt cọc thành công)
// IMPORTANT: After successful deposit payment, Order.Status may still be "Pending" 
// but DepositStatus should be "Paid" or "Succeeded", OR Product.Status = "Reserved"
const productIsReserved = productStatus === 'reserved';
const isDeposited = orderStatus === 'deposited' || 
                   orderStatus === 'depositpaid' || 
                   orderStatus === 'deposit_paid' ||
                   depositStatus === 'paid' ||
                   depositStatus === 'succeeded' ||
                   productIsReserved; // ✅ Nếu product đã Reserved thì đã đặt cọc thành công
```

**Logic mới:**
- Nếu `Product.Status = "Reserved"` → Coi như đã đặt cọc thành công → Hiển thị với badge **"Đã đặt cọc"** (vàng)

## 📋 Mapping Status

### Sau Khi Đặt Cọc Thành Công:

| Field | Value | Source |
|-------|-------|--------|
| `Order.Status` | `"Pending"` | ❌ Không được update |
| `Order.DepositStatus` | `"Unpaid"` | ❌ Không được update |
| `Product.Status` | `"Reserved"` | ✅ Được update bởi PaymentController |

### Frontend Logic:

```javascript
// Check Product.Status = "Reserved"
if (productStatus === 'reserved') {
    // → isDeposited = true
    // → Hiển thị trong "đơn mua" với badge "Đã đặt cọc" (vàng)
}
```

## 🎯 Kết Quả

Sau khi sửa:
- ✅ Order với `Product.Status = "Reserved"` sẽ hiển thị trong "đơn mua"
- ✅ Badge hiển thị: **"Đã đặt cọc"** (vàng)
- ✅ Buyer có thể theo dõi đơn hàng đã đặt cọc

## ⚠️ Lưu Ý

**Backend nên được sửa để update Order.Status và Order.DepositStatus sau khi payment thành công:**

```csharp
// Trong PaymentController.cs, sau khi payment thành công:
if (payment.PaymentType == "Deposit" && payment.OrderId.HasValue)
{
    var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == payment.OrderId.Value);
    if (order != null)
    {
        order.OrderStatus = "Deposited";  // ✅ Update Order.Status
        order.DepositStatus = "Paid";     // ✅ Update Order.DepositStatus
        order.UpdatedAt = DateTime.UtcNow;
    }
}
```

Nhưng hiện tại frontend đã xử lý được vấn đề này bằng cách check `Product.Status = "Reserved"`.



