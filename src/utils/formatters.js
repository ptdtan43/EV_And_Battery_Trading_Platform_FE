export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

export const formatDate = (date) => {
  if (!date) return 'Chưa có';

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Chưa có';
    }
    return dateObj.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return 'Chưa có';
  }
};

export const formatDateTime = (date) => {
  if (!date) return 'Chưa có';

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Chưa có';
    }
    return dateObj.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Chưa có';
  }
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

export const getConditionText = (condition) => {
  const conditions = {
    excellent: 'Xuất sắc',
    good: 'Tốt',
    fair: 'Khá',
    poor: 'Trung bình',
  };
  return conditions[condition] || condition;
};

export const getStatusText = (status) => {
  const statuses = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    sold: 'Đã bán',
  };
  return statuses[status] || status;
};

export const getOrderStatusText = (status) => {
  if (!status) return 'Không xác định';

  const statusLower = status.toLowerCase();
  const statusMap = {
    pending: 'Đang trong quá trình thanh toán',
    processing: 'Đang xử lý',
    confirmed: 'Đã xác nhận',
    depositpaid: 'Đã thanh toán cọc',
    deposited: 'Đã thanh toán cọc',
    completed: 'Hoàn tất',
    cancelled: 'Đã hủy',
    canceled: 'Đã hủy',
    active: 'Hoạt động',
    reserved: 'Đã đặt cọc',
    sold: 'Đã bán',
  };
  return statusMap[statusLower] || status;
};

export const getProductTypeText = (type) => {
  const types = {
    vehicle: 'Xe điện',
    battery: 'Pin xe điện',
  };
  return types[type] || type;
};
