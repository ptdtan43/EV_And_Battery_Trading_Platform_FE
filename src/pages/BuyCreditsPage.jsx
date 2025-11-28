import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getPackages, createPayment } from '../lib/paymentApiClient';
import { PackageCard } from '../components/common/PackageCard';
import { CreditBalance } from '../components/common/CreditBalance';
import { getMyCredits } from '../lib/api';
import { ArrowLeft, HelpCircle, Zap } from 'lucide-react';

export const BuyCreditsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show: showToast } = useToast();

  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Load packages and current credits
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load packages (public API, no auth needed)
      const packagesData = await getPackages();
      setPackages(packagesData || []);

      // Load current credits if logged in
      if (user) {
        const credits = await getMyCredits();
        setCurrentCredits(credits);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast({
        type: 'error',
        title: 'Lỗi',
        description: 'Không thể tải danh sách gói credits'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleBuyNow = async () => {
    // Check if user is logged in
    if (!user) {
      showToast({
        type: 'error',
        title: 'Chưa đăng nhập',
        description: 'Vui lòng đăng nhập để mua credits'
      });
      navigate('/login');
      return;
    }

    // Check if package is selected
    if (!selectedPackage) {
      showToast({
        type: 'error',
        title: 'Chưa chọn gói',
        description: 'Vui lòng chọn một gói credits'
      });
      return;
    }

    try {
      setPurchasing(true);

      console.log('🛒 Creating payment for package:', {
        credits: selectedPackage.credits,
        price: selectedPackage.price,
        packageId: selectedPackage.packageId
      });

      // Create payment with amount from package
      const result = await createPayment(selectedPackage.credits, selectedPackage.price);
      
      console.log('✅ Payment created successfully:', result);

      // Store payment info for later
      localStorage.setItem('evtb_payment_pending', JSON.stringify({
        paymentId: result.paymentId,
        credits: selectedPackage.credits,
        amount: selectedPackage.price,
        timestamp: Date.now()
      }));

      // Open VNPay in new tab (same as other payment flows)
      const paymentWindow = window.open(
        result.paymentUrl,
        '_blank'
      );

      if (paymentWindow && typeof paymentWindow.focus === 'function') {
        paymentWindow.focus();
      }

      if (!paymentWindow) {
        showToast({
          type: 'error',
          title: 'Lỗi',
          description: 'Không thể mở tab thanh toán. Vui lòng cho phép popup.'
        });
        return;
      }

      showToast({
        type: 'info',
        title: 'Đang chuyển đến VNPay',
        description: 'Vui lòng hoàn tất thanh toán trên tab mới',
        duration: 5000
      });

    } catch (error) {
      console.error('❌ Error creating payment:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        response: error.response
      });
      
      // More detailed error message
      let errorMessage = 'Không thể tạo thanh toán. Vui lòng thử lại.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng thử lại.';
      } else if (error.status === 401) {
        errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng liên hệ support hoặc thử lại sau.';
      }
      
      showToast({
        type: 'error',
        title: 'Lỗi thanh toán',
        description: errorMessage
      });
    } finally {
      setPurchasing(false);
    }
  };

  // Listen for payment success message
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.status === 'success' && event.data?.type === 'PostCredit') {
        showToast({
          type: 'success',
          title: 'Thanh toán thành công!',
          description: 'Credits đã được cộng vào tài khoản của bạn',
          duration: 5000
        });
        
        // Reload credits
        loadData();
        
        // Clear pending payment
        localStorage.removeItem('evtb_payment_pending');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mua Credits
          </h1>
          <p className="text-gray-600">
            Chọn gói credits phù hợp để đăng tin sản phẩm của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Current Balance */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {user ? (
                <CreditBalance
                  credits={currentCredits}
                  loading={loading}
                  onBuyMore={() => {
                    // Scroll to packages
                    document.getElementById('packages')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                />
              ) : (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="text-center">
                    <div className="text-gray-600 mb-4">
                      Đăng nhập để xem số dư credits
                    </div>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      Đăng nhập
                    </button>
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="text-yellow-500" size={20} />
                  <h3 className="font-semibold text-gray-900">
                    Cách hoạt động
                  </h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>Chọn gói credits phù hợp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>Thanh toán qua VNPay</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>Credits được cộng ngay lập tức</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <span>Sử dụng để đăng tin sản phẩm</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Packages */}
          <div className="lg:col-span-2">
            <div id="packages" className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Chọn gói Credits
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-xl h-80" />
                  </div>
                ))}
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <HelpCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">
                  Không có gói credits nào
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {packages.map((pkg) => (
                    <PackageCard
                      key={pkg.packageId}
                      package={pkg}
                      selected={selectedPackage?.packageId === pkg.packageId}
                      onSelect={handleSelectPackage}
                      loading={purchasing}
                    />
                  ))}
                </div>

                {/* Buy Button */}
                {selectedPackage && (
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-gray-600">
                          Đã chọn: <span className="font-semibold">{selectedPackage.credits} Credits</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(selectedPackage.price)}
                        </div>
                      </div>
                      <button
                        onClick={handleBuyNow}
                        disabled={purchasing}
                        className={`
                          px-8 py-3 rounded-lg font-semibold text-white
                          ${purchasing
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                          }
                          transition-colors duration-200
                        `}
                      >
                        {purchasing ? 'Đang xử lý...' : 'Mua ngay'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                1 Credit có giá trị bao lâu?
              </h3>
              <p className="text-gray-600">
                Credits không có thời hạn sử dụng. Bạn có thể sử dụng bất cứ lúc nào.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Tôi có thể hoàn tiền không?
              </h3>
              <p className="text-gray-600">
                Credits đã mua không thể hoàn tiền. Vui lòng cân nhắc kỹ trước khi mua.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Thanh toán có an toàn không?
              </h3>
              <p className="text-gray-600">
                Chúng tôi sử dụng VNPay - cổng thanh toán uy tín và bảo mật hàng đầu Việt Nam.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
