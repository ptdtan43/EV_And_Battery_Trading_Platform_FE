import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getCreditHistory } from '../lib/paymentApiClient';
import { CreditBalance } from '../components/common/CreditBalance';
import { TransactionItem } from '../components/common/TransactionItem';
import { ArrowLeft, Filter, History, Download } from 'lucide-react';

export const CreditHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show: showToast } = useToast();

  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Load credit history
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getCreditHistory();
      setHistoryData(data);
    } catch (error) {
      console.error('Error loading credit history:', error);
      showToast({
        type: 'error',
        title: 'Lỗi',
        description: 'Không thể tải lịch sử credits'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleViewPayment = (paymentId) => {
    // Navigate to payment detail page (if exists)
    console.log('View payment:', paymentId);
    showToast({
      type: 'info',
      title: 'Payment ID',
      description: `Payment #${paymentId}`
    });
  };

  // Filter history
  const filteredHistory = historyData?.history?.filter((item) => {
    if (filter === 'all') return true;
    return item.changeType.toLowerCase() === filter.toLowerCase();
  }) || [];

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'Tất cả', count: historyData?.history?.length || 0 },
    { value: 'purchase', label: 'Mua credits', count: historyData?.history?.filter(h => h.changeType === 'Purchase').length || 0 },
    { value: 'use', label: 'Sử dụng', count: historyData?.history?.filter(h => h.changeType === 'Use').length || 0 },
    { value: 'refund', label: 'Hoàn tiền', count: historyData?.history?.filter(h => h.changeType === 'Refund').length || 0 },
    { value: 'adminadjust', label: 'Điều chỉnh', count: historyData?.history?.filter(h => h.changeType === 'AdminAdjust').length || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Lịch sử Credits
              </h1>
              <p className="text-gray-600">
                Xem tất cả giao dịch credits của bạn
              </p>
            </div>
            
            {/* Export button (optional) */}
            <button
              onClick={() => {
                showToast({
                  type: 'info',
                  title: 'Tính năng đang phát triển',
                  description: 'Xuất file sẽ sớm có'
                });
              }}
              className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download size={18} />
              <span>Xuất file</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Balance & Stats */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Current Balance */}
              {loading ? (
                <div className="animate-pulse bg-gray-200 rounded-2xl h-64" />
              ) : (
                <CreditBalance
                  credits={historyData?.currentCredits || 0}
                  totalPurchased={historyData?.totalPurchased}
                  totalUsed={historyData?.totalUsed}
                  loading={loading}
                />
              )}

              {/* Quick Stats */}
              {!loading && historyData && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Thống kê
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tổng giao dịch</span>
                      <span className="font-semibold text-gray-900">
                        {historyData.history?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Đã mua</span>
                      <span className="font-semibold text-green-600">
                        +{historyData.totalPurchased || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Đã dùng</span>
                      <span className="font-semibold text-red-600">
                        -{historyData.totalUsed || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-2">
            {/* Filter */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={18} className="text-gray-600" />
                <span className="font-semibold text-gray-900">Lọc theo loại</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${filter === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {option.label}
                    {option.count > 0 && (
                      <span className="ml-1.5 opacity-75">({option.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* History List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32" />
                ))}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <History className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 mb-2">
                  {filter === 'all' 
                    ? 'Chưa có giao dịch nào'
                    : `Không có giao dịch loại "${filterOptions.find(f => f.value === filter)?.label}"`
                  }
                </p>
                {filter === 'all' && (
                  <button
                    onClick={() => navigate('/credits/buy')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mua Credits ngay
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((transaction) => (
                  <TransactionItem
                    key={transaction.historyId}
                    transaction={transaction}
                    onViewProduct={handleViewProduct}
                    onViewPayment={handleViewPayment}
                  />
                ))}
              </div>
            )}

            {/* Load More (if needed in future) */}
            {filteredHistory.length > 0 && (
              <div className="mt-6 text-center text-sm text-gray-500">
                Hiển thị {filteredHistory.length} giao dịch
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
