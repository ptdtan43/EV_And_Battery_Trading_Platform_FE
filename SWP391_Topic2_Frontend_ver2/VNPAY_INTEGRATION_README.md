# Hệ thống tích hợp thanh toán VNPay

Hệ thống tích hợp thanh toán VNPay cho dự án React SPA với các tính năng đầy đủ và dễ sử dụng.

## Cấu trúc file

```
src/
├── lib/
│   └── apiClient.js          # API client với xử lý lỗi và auth
├── api/
│   └── payment.js           # API functions cho thanh toán
├── components/
│   ├── PayWithVnPayButton.jsx    # Component nút thanh toán chính
│   └── PaymentSection.jsx         # Component section thanh toán
├── pages/
│   ├── PaymentResult.jsx         # Trang kết quả thanh toán
│   └── PaymentExample.jsx        # Trang ví dụ sử dụng
├── hooks/
│   └── useAuthToken.js           # Hook lấy auth token
└── App.jsx                      # Router đã được cập nhật
```

## Cấu hình

### 1. Cấu hình API Base URL

Tạo file `.env` trong thư mục gốc:
```env
VITE_API_BASE=http://localhost:5044
```

Hoặc hardcode trong `src/lib/apiClient.js`:
```javascript
export const API_BASE = "http://localhost:5044";
```

### 2. Backend Endpoints

Hệ thống yêu cầu các endpoint sau từ backend:

- `POST /api/payment` (Bearer JWT) → Trả về `{ paymentUrl: string, paymentId: number }`
- `GET /api/payment/vnpay-return` (AllowAnonymous) → Xử lý callback từ VNPay
- `POST /api/payment/vnpay-ipn` (AllowAnonymous) → Server-to-server callback
- `GET /api/payment/{id}` (Bearer JWT) → Lấy thông tin thanh toán (optional)

## Sử dụng

### 1. Sử dụng PayWithVnPayButton

```jsx
import PayWithVnPayButton, { PAYMENT_TYPES } from "../components/PayWithVnPayButton";
import { useAuthToken } from "../hooks/useAuthToken";

const MyComponent = () => {
  const { token } = useAuthToken();
  
  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    // Xử lý lỗi
  };

  const handlePaymentSuccess = (result) => {
    console.log("Payment created:", result);
    // Xử lý thành công
  };

  return (
    <PayWithVnPayButton
      token={token}
      amount={1000000} // 1,000,000 VND
      paymentType={PAYMENT_TYPES.DEPOSIT}
      orderId={123}
      onError={handlePaymentError}
      onSuccess={handlePaymentSuccess}
      className="w-full"
    />
  );
};
```

### 2. Sử dụng PaymentSection (Đơn giản hơn)

```jsx
import PaymentSection, { DepositPayment, FinalPayment, VerificationPayment } from "../components/PaymentSection";

// Sử dụng component tổng quát
<PaymentSection
  amount={1000000}
  paymentType="Deposit"
  orderId={123}
  onError={(error) => console.error(error)}
  onSuccess={(result) => console.log(result)}
/>

// Hoặc sử dụng component đã cấu hình sẵn
<DepositPayment
  orderId={123}
  amount={1000000}
  onError={(error) => console.error(error)}
  onSuccess={(result) => console.log(result)}
/>

<FinalPayment
  orderId={123}
  amount={2000000}
  onError={(error) => console.error(error)}
  onSuccess={(result) => console.log(result)}
/>

<VerificationPayment
  productId={456}
  amount={500000}
  onError={(error) => console.error(error)}
  onSuccess={(result) => console.log(result)}
/>
```

### 3. Các loại thanh toán

```javascript
import { PAYMENT_TYPES } from "../api/payment";

// Đặt cọc (cần orderId)
PAYMENT_TYPES.DEPOSIT

// Thanh toán cuối (cần orderId)
PAYMENT_TYPES.FINAL_PAYMENT

// Xác minh (cần productId)
PAYMENT_TYPES.VERIFICATION
```

## Routes

Hệ thống đã thêm các route sau:

- `/payment/result` - Trang kết quả thanh toán
- `/payment/example` - Trang ví dụ sử dụng

## Tính năng

### ✅ Đã hoàn thành

- [x] Component nút thanh toán với loading state
- [x] Xử lý lỗi mạng và auth (401/403/500)
- [x] Tự động chặn double click
- [x] Validation dữ liệu đầu vào
- [x] Trang kết quả thanh toán với UI đẹp
- [x] Hook tiện ích để lấy auth token
- [x] Component section thanh toán đơn giản
- [x] Format tiền tệ VND
- [x] TypeScript-like types (JSDoc)
- [x] Error handling toàn diện
- [x] Responsive design

### 🔧 Cấu hình

- [x] API client với fetch wrapper
- [x] Environment variables support
- [x] CORS handling
- [x] Credentials include

### 🎨 UI/UX

- [x] Loading spinner
- [x] Error messages
- [x] Success feedback
- [x] Responsive design
- [x] Tailwind CSS styling
- [x] Accessibility features

## Xử lý lỗi

Hệ thống tự động xử lý các lỗi phổ biến:

- **401 Unauthorized**: Tự động clear auth và redirect về login
- **403 Forbidden**: Hiển thị thông báo không có quyền
- **500 Server Error**: Hiển thị thông báo lỗi server
- **Network Error**: Hiển thị thông báo lỗi mạng
- **Validation Error**: Hiển thị lỗi validation dữ liệu

## Ví dụ tích hợp

### Trong trang đặt hàng

```jsx
import { DepositPayment } from "../components/PaymentSection";

const OrderPage = ({ order }) => {
  const handlePaymentSuccess = (result) => {
    // Redirect hoặc cập nhật UI
    window.location.href = "/orders";
  };

  return (
    <div>
      <h2>Đặt hàng #{order.id}</h2>
      <p>Số tiền cọc: {formatAmount(order.depositAmount)}</p>
      
      <DepositPayment
        orderId={order.id}
        amount={order.depositAmount}
        onSuccess={handlePaymentSuccess}
        onError={(error) => alert(error.message)}
      />
    </div>
  );
};
```

### Trong trang sản phẩm

```jsx
import { VerificationPayment } from "../components/PaymentSection";

const ProductPage = ({ product }) => {
  return (
    <div>
      <h2>{product.name}</h2>
      <p>Giá xác minh: {formatAmount(product.verificationFee)}</p>
      
      <VerificationPayment
        productId={product.id}
        amount={product.verificationFee}
        onSuccess={() => alert("Đang chuyển đến VNPay...")}
        onError={(error) => alert(error.message)}
      />
    </div>
  );
};
```

## Testing

Để test hệ thống:

1. Truy cập `/payment/example`
2. Đăng nhập với tài khoản hợp lệ
3. Điền thông tin thanh toán
4. Nhấn nút thanh toán
5. Kiểm tra redirect đến VNPay

## Lưu ý

- Đảm bảo backend đã cấu hình đúng các endpoint
- CORS phải được enable cho frontend domain
- JWT token phải hợp lệ và chưa hết hạn
- VNPay sandbox/production URL phải được cấu hình đúng
