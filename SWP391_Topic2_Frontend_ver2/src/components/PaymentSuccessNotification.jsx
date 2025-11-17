import React, { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

const PaymentSuccessNotification = ({ paymentData, onClose }) => {
  const { showToast } = useToast();

  useEffect(() => {
    if (paymentData && paymentData.success) {
      // Show success toast
      showToast({
        type: 'success',
        title: 'Thanh toán thành công!',
        message: `Giao dịch ${paymentData.paymentId} đã được xử lý thành công.`,
        duration: 5000
      });

      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [paymentData, showToast, onClose]);

  return null; // This component doesn't render anything, just handles notifications
};

export default PaymentSuccessNotification;
