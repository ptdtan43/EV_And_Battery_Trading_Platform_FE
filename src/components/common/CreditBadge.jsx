import { Coins } from 'lucide-react';

/**
 * CreditBadge - Display credit amount with color coding
 * @param {Object} props
 * @param {number} props.credits - Number of credits
 * @param {string} [props.size='md'] - Size: 'sm', 'md', 'lg'
 * @param {boolean} [props.showIcon=true] - Show coin icon
 * @param {string} [props.className] - Additional CSS classes
 */
export const CreditBadge = ({ 
  credits = 0, 
  size = 'md', 
  showIcon = true,
  className = '' 
}) => {
  // Color based on credit amount
  const getColorClasses = () => {
    if (credits === 0) {
      return 'bg-red-100 text-red-700 border-red-200';
    } else if (credits <= 2) {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    } else if (credits <= 5) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    } else {
      return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-semibold
        ${getColorClasses()}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {showIcon && <Coins size={iconSizes[size]} />}
      <span>{credits} {credits === 1 ? 'Credit' : 'Credits'}</span>
    </div>
  );
};
