import React from "react";
import { useAuthToken } from "../hooks/useAuthToken";
import PayWithVnPayButton, { PAYMENT_TYPES } from "../components/PayWithVnPayButton";
import { formatAmount } from "../api/payment";

// Simple payment section component that can be embedded in any page
const PaymentSection = ({
  amount,
  paymentType = PAYMENT_TYPES.DEPOSIT,
  orderId = null,
  productId = null,
  onError = null,
  onSuccess = null,
  className = "",
  showAmount = true,
  buttonText = null
}) => {
  const { token, isAuthenticated } = useAuthToken();

  const handleError = (error) => {
    console.error("Payment error:", error);
    if (onError) {
      onError(error);
    } else {
      alert(`Lỗi thanh toán: ${error.message}`);
    }
  };

  const handleSuccess = (result) => {
    console.log("Payment created successfully:", result);
    if (onSuccess) {
      onSuccess(result);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <p className="text-yellow-800 text-center">
          Vui lòng đăng nhập để sử dụng tính năng thanh toán.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showAmount && (
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Số tiền: <span className="text-green-600 font-bold">{formatAmount(amount)}</span>
          </p>
        </div>
      )}
      
      <PayWithVnPayButton
        token={token}
        amount={amount}
        paymentType={paymentType}
        orderId={orderId}
        productId={productId}
        onError={handleError}
        onSuccess={handleSuccess}
        className="w-full"
      >
        {buttonText}
      </PayWithVnPayButton>
    </div>
  );
};

// Pre-configured components for common payment scenarios
export const DepositPayment = ({ orderId, amount, onError, onSuccess, className }) => (
  <PaymentSection
    amount={amount}
    paymentType={PAYMENT_TYPES.DEPOSIT}
    orderId={orderId}
    onError={onError}
    onSuccess={onSuccess}
    className={className}
    buttonText="Đặt cọc qua VNPay"
  />
);

export const FinalPayment = ({ orderId, amount, onError, onSuccess, className }) => (
  <PaymentSection
    amount={amount}
    paymentType={PAYMENT_TYPES.FINAL_PAYMENT}
    orderId={orderId}
    onError={onError}
    onSuccess={onSuccess}
    className={className}
    buttonText="Thanh toán cuối qua VNPay"
  />
);

export const VerificationPayment = ({ productId, amount, onError, onSuccess, className }) => (
  <PaymentSection
    amount={amount}
    paymentType={PAYMENT_TYPES.VERIFICATION}
    productId={productId}
    onError={onError}
    onSuccess={onSuccess}
    className={className}
    buttonText="Xác minh qua VNPay"
  />
);

export default PaymentSection;
