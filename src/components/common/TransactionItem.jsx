import { CreditCard, FileText, RotateCcw, Settings, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDate, formatPrice } from '../../lib/api';

/**
 * Translate English reason to Vietnamese
 */
const translateReason = (reason) => {
  if (!reason) return '';
  
  const translations = {
    'Posted product': 'Đã đăng sản phẩm',
    'Reapproved product after rejection': 'Đăng lại sản phẩm sau khi bị từ chối',
    'Product rejected': 'Sản phẩm bị từ chối',
    'Purchased credit package': 'Đã mua gói credit',
    'Admin adjustment': 'Điều chỉnh bởi admin',
    'Refund for rejected product': 'Hoàn credit cho sản phẩm bị từ chối',
    'System refund': 'Hoàn credit hệ thống',
    'Resubmitted product after rejection': 'Đăng lại sau khi bị từ chối',
    'Reason': 'Lý do',
  };
  
  // Check if reason matches any translation key
  for (const [eng, vie] of Object.entries(translations)) {
    if (reason.includes(eng)) {
      return reason.replace(eng, vie);
    }
  }
  
  return reason;
};

/**
 * TransactionItem - Display a credit transaction in history
 * @param {Object} props
 * @param {Object} props.transaction - Transaction data
 * @param {Function} [props.onViewProduct] - Callback to view related product
 * @param {Function} [props.onViewPayment] - Callback to view related payment
 */
export const TransactionItem = ({ 
  transaction,
  onViewProduct,
  onViewPayment 
}) => {
  const {
    historyId,
    changeType,
    creditsBefore,
    creditsChanged,
    creditsAfter,
    reason,
    createdDate,
    relatedPayment,
    relatedProduct,
    adminName
  } = transaction;
  
  // Translate reason to Vietnamese
  const translatedReason = translateReason(reason);

  // Icon and color based on change type
  const getTypeConfig = () => {
    switch (changeType) {
      case 'Purchase':
        return {
          icon: CreditCard,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Mua credits'
        };
      case 'Use':
        return {
          icon: FileText,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Sử dụng'
        };
      case 'Refund':
        return {
          icon: RotateCcw,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          label: 'Hoàn credit'
        };
      case 'AdminAdjust':
        return {
          icon: Settings,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: 'Điều chỉnh'
        };
      default:
        return {
          icon: FileText,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: changeType
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;
  const isPositive = creditsChanged > 0;

  return (
    <div className={`
      rounded-lg border ${config.borderColor} ${config.bgColor} p-4
      transition-all duration-200 hover:shadow-md
    `}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} 
          flex items-center justify-center ${config.color}
        `}>
          <Icon size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <div className="font-semibold text-gray-900">
                {config.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatDate(createdDate)}
              </div>
            </div>
            
            {/* Credits Change */}
            <div className={`
              flex items-center gap-1 font-bold text-lg
              ${isPositive ? 'text-green-600' : 'text-red-600'}
            `}>
              {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {isPositive ? '+' : ''}{creditsChanged}
            </div>
          </div>

          {/* Reason */}
          <div className="text-sm text-gray-700 mb-2">
            {translatedReason}
          </div>

          {/* Balance Change */}
          <div className="text-xs text-gray-600 mb-2">
            Số dư: <span className="font-semibold">{creditsBefore}</span>
            {' → '}
            <span className="font-semibold">{creditsAfter}</span>
          </div>

          {/* Related Links */}
          <div className="flex flex-wrap gap-2">
            {relatedPayment && onViewPayment && (
              <button
                onClick={() => onViewPayment(relatedPayment)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                Xem thanh toán #{relatedPayment}
              </button>
            )}
            
            {relatedProduct && onViewProduct && (
              <button
                onClick={() => onViewProduct(relatedProduct.productId)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                Xem sản phẩm: {relatedProduct.title}
              </button>
            )}
            
            {adminName && (
              <span className="text-xs text-gray-500">
                Bởi: {adminName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
