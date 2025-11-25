import { Check, TrendingUp } from 'lucide-react';
import { formatPrice } from '../../lib/api';

/**
 * PackageCard - Display credit package for purchase
 * @param {Object} props
 * @param {Object} props.package - Package data
 * @param {boolean} [props.selected=false] - Is this package selected
 * @param {Function} props.onSelect - Callback when package is selected
 * @param {boolean} [props.loading=false] - Loading state
 */
export const PackageCard = ({ 
  package: pkg, 
  selected = false, 
  onSelect,
  loading = false 
}) => {
  const {
    packageId,
    credits,
    price,
    pricePerCredit,
    discountPercent,
    isPopular,
    description
  } = pkg;

  return (
    <div 
      className={`
        relative rounded-xl border-2 p-6 transition-all duration-200
        hover:shadow-lg cursor-pointer
        ${selected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : isPopular 
            ? 'border-orange-400 bg-white' 
            : 'border-gray-200 bg-white hover:border-gray-300'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={() => !loading && onSelect?.(pkg)}
    >
      {/* Badges */}
      <div className="absolute -top-3 left-0 right-0 flex justify-between px-4">
        {isPopular && (
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            <TrendingUp size={12} />
            PHỔ BIẾN NHẤT
          </span>
        )}
        {discountPercent > 0 && (
          <span className="ml-auto inline-flex items-center bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            TIẾT KIỆM {discountPercent}%
          </span>
        )}
      </div>

      {/* Selected Checkmark */}
      {selected && (
        <div className="absolute top-4 right-4">
          <div className="bg-blue-500 text-white rounded-full p-1">
            <Check size={16} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mt-4 text-center">
        {/* Credits Amount */}
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {credits}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          Credits
        </div>

        {/* Price */}
        <div className="mb-2">
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(price)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatPrice(pricePerCredit)}/credit
          </div>
        </div>

        {/* Description */}
        <div className="text-sm text-gray-600 mb-4 min-h-[40px]">
          {description}
        </div>

        {/* Buy Button */}
        <button
          className={`
            w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
            ${selected
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : isPopular
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }
            ${loading ? 'cursor-not-allowed opacity-50' : ''}
          `}
          disabled={loading}
          onClick={(e) => {
            e.stopPropagation();
            !loading && onSelect?.(pkg);
          }}
        >
          {loading ? 'Đang xử lý...' : selected ? 'Đã chọn' : 'Chọn gói này'}
        </button>
      </div>
    </div>
  );
};
