// Payment API cho VNPay integration
import { createPaymentRequest } from "../lib/paymentApiClient";

export const PAYMENT_TYPES = {
  DEPOSIT: "Deposit",
  FINAL_PAYMENT: "FinalPayment", 
  VERIFICATION: "Verification"
};

// Types
export const PaymentType = "Deposit" | "FinalPayment" | "Verification";

export const CreatePaymentReq = {
  orderId: null,
  productId: null, 
  amount: 0,
  paymentType: "Deposit"
};

export const CreatePaymentRes = {
  paymentId: 0,
  paymentUrl: ""
};

// Main function để tạo payment
export async function createPayment(body, token) {
  console.log("[VNPay] POST /api/payment", body);
  
  try {
    const response = await createPaymentRequest(body, token);

    console.log("[VNPay] createPayment response:", response);
    
    if (!response?.paymentUrl) {
      throw new Error("paymentUrl empty");
    }

    return response;
  } catch (error) {
    console.error("[VNPay] createPayment error:", error);
    throw error;
  }
}

// Helper functions
export function createPaymentData({
  orderId = null,
  productId = null,
  amount,
  paymentType
}) {
  return {
    orderId,
    productId,
    amount,
    paymentType
  };
}

export function validatePaymentData({ amount, paymentType, orderId, productId }) {
  const errors = [];

  if (!amount || amount <= 0) {
    errors.push("Số tiền phải lớn hơn 0");
  }

  if (!paymentType || !Object.values(PAYMENT_TYPES).includes(paymentType)) {
    errors.push("Loại thanh toán không hợp lệ");
  }

  if (paymentType === PAYMENT_TYPES.VERIFICATION && !productId) {
    errors.push("ProductId là bắt buộc cho thanh toán Verification");
  }

  if ((paymentType === PAYMENT_TYPES.DEPOSIT || paymentType === PAYMENT_TYPES.FINAL_PAYMENT) && !orderId) {
    errors.push("OrderId là bắt buộc cho thanh toán Deposit/FinalPayment");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function formatAmount(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(amount);
}

export function parsePaymentResult(searchParams) {
  const success = searchParams.get("success");
  const paymentId = searchParams.get("paymentId");
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  return {
    success: success === "true" || code === "00",
    paymentId: paymentId ? parseInt(paymentId) : null,
    code,
    message
  };
}

// Get payment status (if backend provides this endpoint)
export async function getPaymentStatus(paymentId, token) {
  try {
    const response = await apiFetch(`/api/payment/${paymentId}`, {
      method: "GET"
    }, token);

    return response;
  } catch (error) {
    console.error("Get payment status error:", error);
    throw error;
  }
}