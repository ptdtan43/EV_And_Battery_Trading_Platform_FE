import { Coins, ShoppingCart, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * CreditBalance - Large card displaying current credit balance
 * @param {Object} props
 * @param {number} props.credits - Current credit balance
 * @param {number} [props.totalPurchased] - Total credits purchased
 * @param {number} [props.totalUsed] - Total credits used
 * @param {boolean} [props.loading=false] - Loading state
 * @param {Function} [props.onBuyMore] - Callback when buy more button clicked
 */
export const CreditBalance = ({ 
  credits = 0,
  totalPurchased,
  totalUsed,
  loading = false,
  onBuyMore
}) => {
  const navigate = useNavigate();
  
  const handleBuyMore = () => {
    if (onBuyMore) {
      onBuyMore();
    } else {
      navigate('/credits/buy');
    }
  };

  // Warning state
  const isLow = credits <= 2 && credits > 0;
  const isEmpty = credits === 0;

  return (
    <div className={`
      relative rounded-2xl p-8 text-white overflow-hidden
      ${isEmpty 
        ? 'bg-gradient-to-br from-red-500 to-red-600' 
        : isLow 
          ? 'bg-gradient-to-br from-orange-500 to-orange-600'
          : 'bg-gradient-to-br from-blue-500 to-purple-600'
      }
    `}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Coins size={24} />
            <span className="text-lg font-medium opacity-90">
              Số dư hiện tại
            </span>
          </div>
          
          {(isLow || isEmpty) && (
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
              <AlertCircle size={16} />
              <span>{isEmpty ? 'Hết credits' : 'Sắp hết'}</span>
            </div>
          )}
        </div>

        {/* Balance */}
        {loading ? (
          <div className="animate-pulse">
            <div className="h-16 bg-white/20 rounded-lg w-48 mb-4" />
          </div>
        ) : (
          <div className="mb-6">
            <div className="text-6xl font-bold mb-2">
              {credits}
            </div>
            <div className="text-lg opacity-90">
              {credits === 1 ? 'Credit' : 'Credits'}
            </div>
          </div>
        )}

        {/* Stats */}
        {(totalPurchased !== undefined || totalUsed !== undefined) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {totalPurchased !== undefined && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm opacity-75 mb-1">Đã mua</div>
                <div className="text-2xl font-bold">{totalPurchased}</div>
              </div>
            )}
            {totalUsed !== undefined && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm opacity-75 mb-1">Đã dùng</div>
                <div className="text-2xl font-bold">{totalUsed}</div>
              </div>
            )}
          </div>
        )}

        {/* Buy More Button */}
        <button
          onClick={handleBuyMore}
          disabled={loading}
          className={`
            w-full bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg
            flex items-center justify-center gap-2
            transition-all duration-200
            hover:bg-gray-100 hover:shadow-lg
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <ShoppingCart size={20} />
          <span>Mua thêm Credits</span>
        </button>

        {/* Warning Message */}
        {isEmpty && (
          <div className="mt-4 text-sm text-center opacity-90">
            Bạn cần credits để đăng tin sản phẩm
          </div>
        )}
        {isLow && (
          <div className="mt-4 text-sm text-center opacity-90">
            Bạn chỉ còn {credits} credit{credits > 1 ? 's' : ''}. Hãy mua thêm!
          </div>
        )}
      </div>
    </div>
  );
};
