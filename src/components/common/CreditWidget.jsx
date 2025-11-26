import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, ShoppingCart, History, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyCredits } from '../../lib/api';

/**
 * CreditWidget - Display user's credits in header with dropdown menu
 * Shows in header next to notifications
 */
export const CreditWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Load credits
  useEffect(() => {
    if (user) {
      loadCredits();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadCredits, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadCredits = async () => {
    try {
      const userCredits = await getMyCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh credits (can be called from parent)
  const refreshCredits = () => {
    loadCredits();
  };

  // Expose refresh function globally for other components
  useEffect(() => {
    window.refreshCredits = refreshCredits;
    return () => {
      delete window.refreshCredits;
    };
  }, []);

  const handleBuyCredits = () => {
    setIsOpen(false);
    navigate('/credits/buy');
  };

  const handleViewHistory = () => {
    setIsOpen(false);
    navigate('/credits/history');
  };

  // Color based on credit amount
  const getColorClasses = () => {
    if (credits === 0) {
      return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
    } else if (credits <= 2) {
      return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
    } else if (credits <= 5) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
    } else {
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Credit Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
          ${getColorClasses()}
          ${isOpen ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
        `}
        title="Credits của bạn"
      >
        <Coins size={18} />
        {loading ? (
          <div className="w-8 h-4 bg-current opacity-20 rounded animate-pulse" />
        ) : (
          <span className="font-semibold text-sm">
            {credits}
          </span>
        )}
        
        {/* Warning indicator */}
        {credits === 0 && (
          <AlertCircle size={14} className="animate-pulse" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Số dư hiện tại</span>
                {credits <= 2 && credits > 0 && (
                  <span className="text-xs text-orange-600 font-medium">
                    Sắp hết!
                  </span>
                )}
                {credits === 0 && (
                  <span className="text-xs text-red-600 font-medium">
                    Hết credits!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Coins size={24} className={
                  credits === 0 ? 'text-red-500' :
                  credits <= 2 ? 'text-orange-500' :
                  credits <= 5 ? 'text-yellow-500' :
                  'text-green-500'
                } />
                <span className="text-2xl font-bold text-gray-900">
                  {credits}
                </span>
                <span className="text-sm text-gray-600">
                  {credits === 1 ? 'Credit' : 'Credits'}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="px-4 py-2 text-xs text-gray-600">
              {credits === 0 ? (
                <p>Bạn cần credits để đăng tin sản phẩm</p>
              ) : credits <= 2 ? (
                <p>Bạn chỉ còn {credits} credit{credits > 1 ? 's' : ''}. Hãy mua thêm!</p>
              ) : (
                <p>Đăng tin trừ 1 credit (hoàn lại nếu bị từ chối)</p>
              )}
            </div>

            {/* Actions */}
            <div className="px-2 py-2 space-y-1">
              <button
                onClick={handleBuyCredits}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ShoppingCart size={16} className="text-blue-600" />
                <span>Mua thêm Credits</span>
              </button>
              
              <button
                onClick={handleViewHistory}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <History size={16} className="text-gray-600" />
                <span>Xem lịch sử</span>
              </button>
            </div>

            {/* Quick tip */}
            <div className="px-4 py-2 mt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                💡 Mua gói lớn để tiết kiệm hơn!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
