import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, CreditCard, Calendar, User, Package, Shield, Coins } from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { apiRequest } from "../lib/api";

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [countdown, setCountdown] = useState(3); // ✅ Giảm từ 5s xuống 3s
  const [paymentData, setPaymentData] = useState(null);
  const [paymentType, setPaymentType] = useState(null); // ✅ Track payment type

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search);
  const vnpResponseCode = urlParams.get('vnp_ResponseCode');
  const vnpTxnRef = urlParams.get('vnp_TxnRef');
  const vnpAmount = urlParams.get('vnp_Amount');
  const vnpTransactionNo = urlParams.get('vnp_TransactionNo');
  const vnpResponseMessage = urlParams.get('vnp_ResponseMessage');

  const isSuccess = vnpResponseCode === '00';

  useEffect(() => {
    const loadPaymentDetails = async () => {
      // Set payment data from URL params
      if (vnpTxnRef) {
        const basicData = {
          paymentId: vnpTxnRef,
          amount: vnpAmount ? parseInt(vnpAmount) / 100 : null, // VNPay amount is in cents
          transactionNo: vnpTransactionNo,
          responseCode: vnpResponseCode,
          responseMessage: vnpResponseMessage,
          timestamp: new Date().toISOString(),
          success: isSuccess
        };
        
        setPaymentData(basicData);

        // ✅ TRY TO GET PAYMENT TYPE FROM MULTIPLE SOURCES
        let fetchedType = null;
        
        // SOURCE 1: Check if backend sent postMessage with type
        // (This happens when VNPay redirects back and backend sends postMessage)
        const checkPostMessage = () => {
          return new Promise((resolve) => {
            const handler = (event) => {
              console.log('📨 Received postMessage:', event.data);
              if (event.data?.status === 'success' && event.data?.type) {
                console.log('✅ Got payment type from postMessage:', event.data.type);
                window.removeEventListener('message', handler);
                resolve(event.data.type);
              }
            };
            window.addEventListener('message', handler);
            // Timeout after 1 second
            setTimeout(() => {
              window.removeEventListener('message', handler);
              resolve(null);
            }, 1000);
          });
        };
        
        fetchedType = await checkPostMessage();
        
        // SOURCE 2: If no postMessage, fetch from API
        if (!fetchedType) {
          try {
            console.log('🔍 Fetching payment details from API for:', vnpTxnRef);
            const payment = await apiRequest(`/api/Payment/${vnpTxnRef}`);
            console.log('📦 Payment data received:', payment);
            
            if (payment) {
              // Try to detect payment type from multiple sources
              fetchedType = payment.PaymentType || payment.paymentType;
              
              // Fallback: If has PostCredits field → It's PostCredit payment
              if (!fetchedType && (payment.PostCredits || payment.postCredits)) {
                fetchedType = 'PostCredit';
                console.log('💡 Detected PostCredit from PostCredits field');
              }
              
              // Fallback: If has OrderId → It's Deposit
              if (!fetchedType && (payment.OrderId || payment.orderId)) {
                fetchedType = 'Deposit';
                console.log('💡 Detected Deposit from OrderId field');
              }
              
              // Fallback: If has ProductId but no OrderId → It's Verification
              if (!fetchedType && (payment.ProductId || payment.productId) && !(payment.OrderId || payment.orderId)) {
                fetchedType = 'Verification';
                console.log('💡 Detected Verification from ProductId field');
              }
              
              // Update payment data with full details
              setPaymentData({
                ...basicData,
                paymentType: fetchedType,
                productId: payment.ProductId || payment.productId,
                postCredits: payment.PostCredits || payment.postCredits
              });
            }
          } catch (error) {
            console.error('❌ Could not fetch payment details:', error);
          }
        }
        
        // Final fallback
        if (!fetchedType) {
          fetchedType = 'Deposit';
          console.warn('⚠️ Could not determine payment type, defaulting to Deposit');
        }
        
        console.log('✅ Final payment type:', fetchedType);
        setPaymentType(fetchedType);
        
        // Show toast notification AFTER fetching payment type
        if (isSuccess) {
          console.log('🎯 Showing toast for payment type:', fetchedType);
          
          let title, message;
          
          if (fetchedType === 'PostCredit') {
            title = '💎 Mua Credits thành công!';
            message = 'Credits đã được cộng vào tài khoản của bạn.';
            console.log('✅ Using PostCredit message');
          } else if (fetchedType === 'Verification') {
            title = '✅ Thanh toán kiểm định thành công!';
            message = 'Yêu cầu kiểm định của bạn đã được thanh toán. Admin sẽ xác nhận trong thời gian sớm nhất.';
            console.log('✅ Using Verification message');
          } else {
            title = '🎉 Thanh toán đặt cọc thành công!';
            message = 'Bạn đã đặt cọc thành công. Vui lòng liên hệ người bán để hoàn tất giao dịch.';
            console.log('✅ Using Deposit message');
          }
          
          console.log('📢 Toast:', { title, message });
          
          showToast({
            type: 'success',
            title: title,
            message: message,
            duration: 6000
          });
        }
        
        // Refresh credits if PostCredit payment
        if (fetchedType === 'PostCredit' && typeof window.refreshCredits === 'function') {
          window.refreshCredits();
        }

        // Notify opener (homepage) if opened in a new tab/window
        try {
          if (window.opener && typeof window.opener.postMessage === 'function') {
            window.opener.postMessage({
              type: 'EVTB_PAYMENT_SUCCESS',
              payload: {
                paymentId: vnpTxnRef,
                amount: vnpAmount,
                transactionNo: vnpTransactionNo,
                paymentType: fetchedType
              }
            }, '*');
          }
        } catch (_) {}
      }
    };

    loadPaymentDetails();

    // Start countdown for redirect
    if (isSuccess) {
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              // ✅ Redirect to homepage with payment success params
              const redirectParams = new URLSearchParams({
                payment_success: 'true',
                payment_id: vnpTxnRef || '',
                payment_type: paymentType || 'Deposit',
                amount: vnpAmount || '0',
                transaction_no: vnpTransactionNo || ''
              });
              navigate(`/?${redirectParams.toString()}`);

              // Attempt to close the tab after redirecting opener
              setTimeout(() => {
                try { window.close(); } catch (_) {}
              }, 100);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

      return () => clearInterval(timer);
    }
  }, [isSuccess, navigate, vnpTxnRef, vnpAmount, vnpTransactionNo, vnpResponseCode, vnpResponseMessage, showToast, paymentType]);

  const formatAmount = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-red-500 px-6 py-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Thanh toán thất bại</h1>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                  Giao dịch không thành công hoặc đã bị hủy.
                </p>
                {vnpResponseMessage && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                    {vnpResponseMessage}
                  </p>
                )}
              </div>

              {/* Payment Details */}
              {paymentData && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Thông tin giao dịch</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã giao dịch:</span>
                      <span className="font-mono text-gray-900">{paymentData.paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã phản hồi:</span>
                      <span className="font-mono text-red-600">{paymentData.responseCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian:</span>
                      <span className="text-gray-900">{formatDate(paymentData.timestamp)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Về trang chủ
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              {paymentType === 'PostCredit' ? (
                <Coins className="h-10 w-10 text-white" />
              ) : paymentType === 'Verification' ? (
                <Shield className="h-10 w-10 text-white" />
              ) : (
                <CheckCircle className="h-10 w-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {paymentType === 'PostCredit' 
                ? 'Mua Credits thành công!' 
                : paymentType === 'Verification' 
                  ? 'Thanh toán kiểm định thành công!' 
                  : 'Thanh toán đặt cọc thành công!'}
            </h1>
            <p className="text-green-100">
              {paymentType === 'PostCredit'
                ? 'Credits đã được cộng vào tài khoản của bạn'
                : paymentType === 'Verification' 
                  ? 'Yêu cầu kiểm định đã được gửi đến admin' 
                  : 'Giao dịch đặt cọc đã được xử lý thành công'}
            </p>
          </div>

          {/* Success Animation */}
          <div className="px-6 py-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 animate-pulse">
                {paymentType === 'PostCredit' ? (
                  <Coins className="h-8 w-8 text-green-600" />
                ) : paymentType === 'Verification' ? (
                  <Shield className="h-8 w-8 text-green-600" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {paymentType === 'PostCredit'
                  ? 'Credits đã được cộng vào tài khoản!'
                  : paymentType === 'Verification' 
                    ? 'Yêu cầu kiểm định đã được gửi!' 
                    : 'Cảm ơn bạn đã đặt cọc!'}
              </h2>
              <p className="text-gray-600">
                {paymentType === 'PostCredit'
                  ? 'Bạn có thể sử dụng credits để đăng tin sản phẩm ngay bây giờ.'
                  : paymentType === 'Verification'
                    ? 'Admin sẽ kiểm tra và xác nhận yêu cầu kiểm định của bạn trong thời gian sớm nhất.'
                    : 'Vui lòng liên hệ người bán để hoàn tất giao dịch và nhận xe.'}
              </p>
            </div>

            {/* Payment Details */}
            {paymentData && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Thông tin giao dịch
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-blue-100">
                    <div className="flex items-center text-gray-600">
                      <Package className="h-4 w-4 mr-2" />
                      <span className="text-sm">Mã giao dịch</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {paymentData.paymentId}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-blue-100">
                    <div className="flex items-center text-gray-600">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span className="text-sm">Số tiền</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {formatAmount(paymentData.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-blue-100">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">Thời gian</span>
                    </div>
                    <span className="text-sm text-gray-900">
                      {formatDate(paymentData.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm">Trạng thái</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Thành công
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Bước tiếp theo</h4>
                  <p className="text-sm text-yellow-700">
                    Bạn sẽ được chuyển về trang chủ trong <span className="font-bold text-yellow-800">{countdown}</span> giây.
                    Hoặc bạn có thể click vào nút bên dưới để quay về ngay.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Về trang chủ ngay
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium"
                >
                  Đơn hàng
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Cần hỗ trợ?{" "}
                <button
                  onClick={() => navigate('/contact')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Liên hệ với chúng tôi
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Floating Success Animation */}
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute top-1/4 left-1/4 animate-bounce">
            <div className="w-4 h-4 bg-green-400 rounded-full opacity-60"></div>
          </div>
          <div className="absolute top-1/3 right-1/4 animate-bounce delay-300">
            <div className="w-3 h-3 bg-emerald-400 rounded-full opacity-60"></div>
          </div>
          <div className="absolute bottom-1/3 left-1/3 animate-bounce delay-700">
            <div className="w-2 h-2 bg-green-300 rounded-full opacity-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
