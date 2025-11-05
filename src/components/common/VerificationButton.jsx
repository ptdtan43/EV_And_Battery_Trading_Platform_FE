import React, { useState } from 'react';
import { Shield, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

export const VerificationButton = ({ 
  productId, 
  currentStatus = 'NotRequested', 
  isOwner = false,
  disabled = false 
}) => {
  const { show } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const handleRequestVerification = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('🔍 Creating verification payment for product:', productId);
      
      // Create payment for verification (200k VND)
      const paymentData = {
        productId: parseInt(productId),
        payerId: user?.id || user?.userId || user?.accountId,
        paymentType: 'Verification',
        amount: 200000, // 200k VND
        status: 'Pending'
      };
      
      console.log('💰 Payment data:', paymentData);
      
      const payment = await apiRequest('/api/Payment', {
        method: 'POST',
        body: paymentData
      });
      
      console.log('✅ Verification payment created:', payment);
      
      // Check if paymentUrl is returned from API
      if (payment?.paymentUrl) {
        console.log('🔗 Opening payment URL:', payment.paymentUrl);
        
        // Open payment URL in new tab (same logic as deposit payment)
        const paymentWindow = window.open(
          payment.paymentUrl,
          "_blank"
        );
        
        // Try focusing the new tab (may be blocked by browser policies)
        if (paymentWindow && typeof paymentWindow.focus === "function") {
          paymentWindow.focus();
        }
        
        show({
          title: '💰 Mở trang thanh toán',
          description: 'Đã mở trang thanh toán 200.000 VNĐ cho dịch vụ kiểm định xe trong tab mới.',
          type: 'success',
        });
      } else {
        // Fallback if no paymentUrl
        show({
          title: '💰 Thanh toán kiểm định xe',
          description: 'Đã tạo đơn thanh toán 200.000 VNĐ cho dịch vụ kiểm định xe. Vui lòng kiểm tra email để thanh toán.',
          type: 'success',
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to create verification payment:', error);
      
      let errorMessage = 'Không thể tạo thanh toán kiểm định';
      if (error.status === 400) {
        errorMessage = 'Dữ liệu thanh toán không hợp lệ';
      } else if (error.status === 401) {
        errorMessage = 'Vui lòng đăng nhập để thực hiện thao tác này';
      } else if (error.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này';
      }
      
      show({
        title: '❌ Lỗi',
        description: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    // Handle both new and old status formats
    let actualStatus = status;
    if (status === 'NotRequested' && currentStatus === true) {
      actualStatus = 'Requested'; // Fallback for inspectionRequested: true
    }
    
    switch (actualStatus) {
      case 'Requested':
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Đang chờ kiểm định',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          buttonText: 'Đã yêu cầu kiểm định',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
          disabled: true
        };
      case 'InProgress':
        return {
          icon: <Shield className="h-4 w-4" />,
          text: 'Đang kiểm định',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          buttonText: 'Đang kiểm định',
          buttonColor: 'bg-blue-500 hover:bg-blue-600',
          disabled: true
        };
      case 'Completed':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Đã kiểm định',
          color: 'bg-green-100 text-green-800 border-green-200',
          buttonText: 'Đã kiểm định',
          buttonColor: 'bg-green-500 hover:bg-green-600',
          disabled: true
        };
      case 'Rejected':
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: 'Từ chối kiểm định',
          color: 'bg-red-100 text-red-800 border-red-200',
          buttonText: 'Yêu cầu lại kiểm định',
          buttonColor: 'bg-red-500 hover:bg-red-600',
          disabled: false
        };
      default:
        return {
          icon: <Shield className="h-4 w-4" />,
          text: 'Chưa kiểm định',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          buttonText: 'Thanh toán kiểm định (200k)',
          buttonColor: 'bg-green-500 hover:bg-green-600',
          disabled: false
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Don't show button if not owner and not requested/verified
  if (!isOwner && (status === 'NotRequested' || status === 'Rejected')) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
        {statusInfo.icon}
        <span className="ml-1">{statusInfo.text}</span>
      </div>

      {/* Action Button */}
      {isOwner && (
        <button
          onClick={handleRequestVerification}
          disabled={loading || disabled || statusInfo.disabled}
          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors duration-200 ${
            loading || disabled || statusInfo.disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : statusInfo.buttonColor
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Đang xử lý...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              {statusInfo.buttonText}
            </>
          )}
        </button>
      )}
    </div>
  );
};
