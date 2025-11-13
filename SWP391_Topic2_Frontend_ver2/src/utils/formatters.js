export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

export const getProductTypeText = (type) => {
  const types = {
    vehicle: 'Xe điện',
    battery: 'Pin xe điện',
  };
  return types[type] || type;
};
