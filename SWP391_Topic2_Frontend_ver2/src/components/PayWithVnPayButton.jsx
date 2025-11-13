import React, { useState, useCallback } from "react";
import { createPayment, createPaymentData, validatePaymentData, PAYMENT_TYPES } from "../api/payment";
import { handleAuthError } from "../lib/apiClient";

const PayWithVnPayButton = ({
  token,
  amount,
  paymentType,
  orderId = null,
  productId = null,
  className = "",
  onError = null,
  onSuccess = null,
  disabled = false,
  children = null
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = useCallback(async () => {
    if (loading || disabled) return;

    // Clear previous error
    setError(null);
    setLoading(true);

    try {
      // Validate payment data
      const validation = validatePaymentData({
        amount,
        paymentType,
        orderId,
        productId
      });

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Create payment request
      const paymentData = createPaymentData({
        orderId,
        productId,
        amount,
        paymentType
      });

      console.log("🚀 Starting payment process...");
      console.log("📋 Payment data:", paymentData);
      console.log("🔑 Token:", token ? "Present" : "Missing");

      // Call API to create payment
      const result = await createPayment(paymentData, token);

      if (!result?.paymentUrl) {
        throw new Error("Không nhận được URL thanh toán từ server");
      }

      console.log("✅ Payment created successfully, redirecting to:", result.paymentUrl);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }

      // Redirect to VNPay
      window.location.href = result.paymentUrl;

    } catch (err) {
      console.error("Payment creation failed:", err);
      
      const errorMessage = err.message || "Không thể tạo giao dịch VNPay. Vui lòng thử lại!";
      setError(errorMessage);

      // Handle auth errors
      if (handleAuthError(err)) {
        return;
      }

      // Call error callback if provided
      if (onError) {
        onError(err);
      } else {
        // Default error handling - show alert
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [token, amount, paymentType, orderId, productId, loading, disabled, onError, onSuccess]);

  const getButtonText = () => {
    if (loading) {
      return "Đang chuyển tới VNPay...";
    }
    return children || "Thanh toán qua VNPay";
  };

  const getButtonClasses = () => {
    const baseClasses = "px-4 py-2 rounded font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    if (loading || disabled) {
      return `${baseClasses} bg-gray-400 text-white cursor-not-allowed opacity-60`;
    }
    
    return `${baseClasses} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`;
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading || disabled}
        onClick={handleClick}
        className={`${getButtonClasses()} ${className}`}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {getButtonText()}
      </button>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default PayWithVnPayButton;
export { PAYMENT_TYPES };
