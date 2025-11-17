import React, { useState } from "react";
import { useAuthToken } from "../hooks/useAuthToken";
import PayWithVnPayButton, { PAYMENT_TYPES } from "../components/PayWithVnPayButton";
import { formatAmount } from "../api/payment";

// Quick demo component for testing VNPay integration
const VnPayDemo = () => {
  const { token, isAuthenticated } = useAuthToken();
  const [amount, setAmount] = useState(100000); // 100,000 VND for testing
  const [orderId, setOrderId] = useState(1);
  const [productId, setProductId] = useState(1);
  const [selectedType, setSelectedType] = useState(PAYMENT_TYPES.DEPOSIT);

  const handleSuccess = (result) => {
    console.log("✅ Payment created successfully:", result);
    alert(`✅ Tạo giao dịch thành công!\nPayment ID: ${result.paymentId}\nĐang chuyển đến VNPay...`);
  };

  const handleError = (error) => {
    console.error("❌ Payment error:", error);
    alert(`❌ Lỗi: ${error.message}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800 font-medium">🔒 Vui lòng đăng nhập để test thanh toán</p>
          <p className="text-yellow-600 text-sm mt-2">Truy cập /login để đăng nhập</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
        🧪 VNPay Integration Demo
      </h2>

      <div className="space-y-4">
        {/* Payment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại thanh toán:
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={PAYMENT_TYPES.DEPOSIT}>💰 Đặt cọc</option>
            <option value={PAYMENT_TYPES.FINAL_PAYMENT}>💳 Thanh toán cuối</option>
            <option value={PAYMENT_TYPES.VERIFICATION}>✅ Xác minh</option>
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số tiền (VND):
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập số tiền"
          />
          <p className="text-sm text-gray-500 mt-1">
            Hiển thị: <span className="font-medium">{formatAmount(amount)}</span>
          </p>
        </div>

        {/* Order ID (for Deposit/FinalPayment) */}
        {(selectedType === PAYMENT_TYPES.DEPOSIT || selectedType === PAYMENT_TYPES.FINAL_PAYMENT) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order ID:
            </label>
            <input
              type="number"
              value={orderId}
              onChange={(e) => setOrderId(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập Order ID"
            />
          </div>
        )}

        {/* Product ID (for Verification) */}
        {selectedType === PAYMENT_TYPES.VERIFICATION && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product ID:
            </label>
            <input
              type="number"
              value={productId}
              onChange={(e) => setProductId(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập Product ID"
            />
          </div>
        )}

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="font-medium text-gray-900 mb-2">📋 Tóm tắt:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Loại:</strong> {
              selectedType === PAYMENT_TYPES.DEPOSIT && "💰 Đặt cọc"
            }
            {selectedType === PAYMENT_TYPES.FINAL_PAYMENT && "💳 Thanh toán cuối"}
            {selectedType === PAYMENT_TYPES.VERIFICATION && "✅ Xác minh"}
            </p>
            <p><strong>Số tiền:</strong> {formatAmount(amount)}</p>
            {(selectedType === PAYMENT_TYPES.DEPOSIT || selectedType === PAYMENT_TYPES.FINAL_PAYMENT) && (
              <p><strong>Order ID:</strong> {orderId}</p>
            )}
            {selectedType === PAYMENT_TYPES.VERIFICATION && (
              <p><strong>Product ID:</strong> {productId}</p>
            )}
          </div>
        </div>

        {/* Payment Button */}
        <PayWithVnPayButton
          token={token}
          amount={amount}
          paymentType={selectedType}
          orderId={selectedType === PAYMENT_TYPES.VERIFICATION ? null : orderId}
          productId={selectedType === PAYMENT_TYPES.VERIFICATION ? productId : null}
          onError={handleError}
          onSuccess={handleSuccess}
          className="w-full"
        >
          🚀 Thanh toán qua VNPay
        </PayWithVnPayButton>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center">
          <p>💡 Đây là trang demo để test tích hợp VNPay</p>
          <p>🔗 Sau khi thanh toán sẽ redirect về /payment/result</p>
        </div>
      </div>
    </div>
  );
};

export default VnPayDemo;
