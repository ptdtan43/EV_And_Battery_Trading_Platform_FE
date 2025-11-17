import React from "react";
import VnPayDemo from "../components/VnPayDemo";

// Example page showing VNPay integration
const PaymentExample = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 VNPay Integration Demo
          </h1>
          <p className="text-lg text-gray-600">
            Trang demo để test tích hợp thanh toán VNPay
          </p>
        </div>

        <VnPayDemo />

        <div className="mt-8 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📚 Hướng dẫn sử dụng
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Các loại thanh toán:</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>Đặt cọc:</strong> Cần Order ID, dùng cho đặt cọc đơn hàng</li>
                <li>• <strong>Thanh toán cuối:</strong> Cần Order ID, dùng cho thanh toán số tiền còn lại</li>
                <li>• <strong>Xác minh:</strong> Cần Product ID, dùng cho xác minh sản phẩm</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Quy trình thanh toán:</h3>
              <ol className="text-sm text-gray-600 space-y-1 ml-4">
                <li>1. Điền thông tin thanh toán</li>
                <li>2. Nhấn nút "Thanh toán qua VNPay"</li>
                <li>3. Hệ thống gọi API tạo giao dịch</li>
                <li>4. Redirect đến cổng VNPay</li>
                <li>5. Thanh toán trên VNPay</li>
                <li>6. VNPay redirect về /payment/result</li>
                <li>7. Hiển thị kết quả thanh toán</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Tích hợp vào trang khác:</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre className="text-xs text-gray-700 overflow-x-auto">
{`import PayWithVnPayButton, { PAYMENT_TYPES } from "../components/PayWithVnPayButton";
import { useAuthToken } from "../hooks/useAuthToken";

const MyPage = () => {
  const { token } = useAuthToken();
  
  return (
    <PayWithVnPayButton
      token={token}
      amount={1000000}
      paymentType={PAYMENT_TYPES.DEPOSIT}
      orderId={123}
      onError={(error) => console.error(error)}
      onSuccess={(result) => console.log(result)}
    />
  );
};`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">4. Lưu ý quan trọng:</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Đảm bảo đã đăng nhập để có JWT token</li>
                <li>• Backend phải có endpoint POST /api/payment</li>
                <li>• CORS phải được cấu hình đúng</li>
                <li>• VNPay sandbox/production URL phải đúng</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentExample;
