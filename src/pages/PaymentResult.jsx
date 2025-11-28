import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { parsePaymentResult, formatAmount, getPaymentStatus } from "../api/payment";
import { getAuthToken } from "../lib/apiClient";

const PaymentResult = () => {
  const location = useLocation();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search);
  const result = parsePaymentResult(urlParams);

  useEffect(() => {
    // If we have a paymentId, try to fetch additional payment info
    if (result.paymentId) {
      fetchPaymentInfo(result.paymentId);
    }
  }, [result.paymentId]);

  const fetchPaymentInfo = async (paymentId) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token available for fetching payment info");
        return;
      }

      const paymentData = await getPaymentStatus(paymentId, token);
      setPaymentInfo(paymentData);
    } catch (err) {
      console.error("Failed to fetch payment info:", err);
      setError("Không thể tải thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (result.success) {
      return (
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
  };

  const getStatusMessage = () => {
    if (result.success) {
      return {
        title: "Thanh toán thành công!",
        description: "Giao dịch của bạn đã được xử lý thành công.",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-800"
      };
    } else {
      return {
        title: "Thanh toán thất bại",
        description: result.message || "Giao dịch không thành công hoặc đã bị hủy.",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800"
      };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-8 text-center">
            {getStatusIcon()}
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Kết quả thanh toán
            </h1>
          </div>

          {/* Status Message */}
          <div className={`px-6 py-4 ${statusMessage.bgColor} ${statusMessage.borderColor} border-l-4`}>
            <div className="flex">
              <div className="ml-3">
                <p className={`text-sm font-medium ${statusMessage.textColor}`}>
                  {statusMessage.title}
                </p>
                <p className={`mt-1 text-sm ${statusMessage.textColor}`}>
                  {statusMessage.description}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="px-6 py-4 bg-gray-50">
            <dl className="space-y-3">
              {result.paymentId && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Mã giao dịch:</dt>
                  <dd className="text-sm text-gray-900 font-mono">{result.paymentId}</dd>
                </div>
              )}
              
              {result.code && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Mã phản hồi:</dt>
                  <dd className="text-sm text-gray-900 font-mono">{result.code}</dd>
                </div>
              )}

              {paymentInfo?.amount && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Số tiền:</dt>
                  <dd className="text-sm text-gray-900">{formatAmount(paymentInfo.amount)}</dd>
                </div>
              )}

              {paymentInfo?.paymentType && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Loại thanh toán:</dt>
                  <dd className="text-sm text-gray-900">
                    {paymentInfo.paymentType === "Deposit" && "Đặt cọc"}
                    {paymentInfo.paymentType === "FinalPayment" && "Thanh toán cuối"}
                    {paymentInfo.paymentType === "Verification" && "Xác minh"}
                  </dd>
                </div>
              )}

              {paymentInfo?.createdAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Thời gian:</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(paymentInfo.createdAt).toLocaleString("vi-VN")}
                  </dd>
                </div>
              )}
            </dl>

            {loading && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Đang tải thông tin...</span>
              </div>
            )}

            {error && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              <Link
                to="/dashboard"
                className="flex-1 bg-blue-600 text-white text-center px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Về trang chủ
              </Link>
              
              <Link
                to="/orders"
                className="flex-1 bg-gray-600 text-white text-center px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                Xem đơn hàng
              </Link>
            </div>

            {!result.paymentId && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Không có thông tin giao dịch. Vui lòng kiểm tra trong{" "}
                  <Link to="/orders" className="text-blue-600 hover:text-blue-800">
                    đơn hàng của bạn
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Cần hỗ trợ?{" "}
            <Link to="/contact" className="text-blue-600 hover:text-blue-800">
              Liên hệ với chúng tôi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
