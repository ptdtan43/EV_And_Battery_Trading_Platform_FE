import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  Eye, 
  MapPin, 
  DollarSign,
  Clock,
  Percent,
  Zap,
  Car,
  Battery,
  Settings,
  ArrowRight,
  CheckCircle,
  Calendar,
  Users,
  Award,
  Gift,
  Tag,
  Flame,
  TrendingUp
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { formatPrice } from '../utils/formatters';

export const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const dealData = [
    {
      id: 'flash-sale-1',
      title: 'Flash Sale VinFast - Giảm đến 30%',
      description: 'Cơ hội vàng sở hữu xe điện VinFast với mức giá cực kỳ hấp dẫn',
      image: '/deals/vinfast-flash-sale.jpg',
      originalPrice: 35000000,
      salePrice: 24500000,
      discount: 30,
      category: 'Xe máy điện',
      brand: 'VinFast',
      type: 'flash-sale',
      color: 'from-red-500 to-red-700',
      validUntil: '2024-12-31',
      participants: 1250,
      rating: 4.8,
      features: ['Giảm giá 30%', 'Bảo hành 5 năm', 'Tặng phụ kiện', 'Miễn phí vận chuyển'],
      terms: [
        'Áp dụng cho tất cả sản phẩm VinFast',
        'Không áp dụng kèm khuyến mãi khác',
        'Có thể thay đổi mà không báo trước'
      ]
    },
    {
      id: 'combo-deal-1',
      title: 'Combo Pin + Bộ sạc - Tiết kiệm 25%',
      description: 'Mua combo pin lithium-ion và bộ sạc nhanh với giá ưu đãi',
      image: '/deals/combo-pin-sac.jpg',
      originalPrice: 12000000,
      salePrice: 9000000,
      discount: 25,
      category: 'Pin xe điện',
      brand: 'Đa thương hiệu',
      type: 'combo',
      color: 'from-blue-500 to-blue-700',
      validUntil: '2024-12-25',
      participants: 890,
      rating: 4.6,
      features: ['Tiết kiệm 25%', 'Pin chính hãng', 'Bộ sạc nhanh', 'Bảo hành 2 năm'],
      terms: [
        'Chỉ áp dụng khi mua combo',
        'Không tách lẻ sản phẩm',
        'Số lượng có hạn'
      ]
    },
    {
      id: 'new-user-1',
      title: 'Ưu đãi người dùng mới - Giảm 20%',
      description: 'Đăng ký tài khoản mới và nhận ngay ưu đãi giảm giá 20%',
      image: '/deals/new-user-deal.jpg',
      originalPrice: 20000000,
      salePrice: 16000000,
      discount: 20,
      category: 'Tất cả',
      brand: 'Tất cả',
      type: 'new-user',
      color: 'from-green-500 to-green-700',
      validUntil: '2024-12-20',
      participants: 2100,
      rating: 4.7,
      features: ['Giảm giá 20%', 'Áp dụng tất cả sản phẩm', 'Không giới hạn số lượng', 'Hỗ trợ 24/7'],
      terms: [
        'Chỉ áp dụng cho người dùng mới',
        'Cần xác thực tài khoản',
        'Một lần duy nhất'
      ]
    },
    {
      id: 'seasonal-1',
      title: 'Khuyến mãi cuối năm - Giảm đến 40%',
      description: 'Chương trình khuyến mãi lớn nhất năm với mức giảm giá cực sốc',
      image: '/deals/end-year-sale.jpg',
      originalPrice: 50000000,
      salePrice: 30000000,
      discount: 40,
      category: 'Tất cả',
      brand: 'Tất cả',
      type: 'seasonal',
      color: 'from-purple-500 to-purple-700',
      validUntil: '2024-12-31',
      participants: 3500,
      rating: 4.9,
      features: ['Giảm giá đến 40%', 'Hàng trăm sản phẩm', 'Quà tặng hấp dẫn', 'Giao hàng nhanh'],
      terms: [
        'Áp dụng cho tất cả sản phẩm',
        'Số lượng có hạn',
        'Không hoàn tiền'
      ]
    },
    {
      id: 'trade-in-1',
      title: 'Đổi cũ lấy mới - Giảm 15%',
      description: 'Đổi xe cũ lấy xe mới và nhận thêm ưu đãi giảm giá',
      image: '/deals/trade-in-deal.jpg',
      originalPrice: 30000000,
      salePrice: 25500000,
      discount: 15,
      category: 'Xe máy điện',
      brand: 'Tất cả',
      type: 'trade-in',
      color: 'from-orange-500 to-orange-700',
      validUntil: '2024-12-28',
      participants: 650,
      rating: 4.5,
      features: ['Giảm giá 15%', 'Đánh giá xe cũ', 'Hỗ trợ thủ tục', 'Bảo hành đầy đủ'],
      terms: [
        'Cần đánh giá xe cũ trước',
        'Áp dụng theo giá trị xe cũ',
        'Không áp dụng xe hỏng nặng'
      ]
    },
    {
      id: 'installment-1',
      title: 'Trả góp 0% lãi suất',
      description: 'Mua xe điện trả góp với lãi suất 0% trong 12 tháng',
      image: '/deals/installment-deal.jpg',
      originalPrice: 40000000,
      salePrice: 40000000,
      discount: 0,
      category: 'Tất cả',
      brand: 'Tất cả',
      type: 'installment',
      color: 'from-indigo-500 to-indigo-700',
      validUntil: '2024-12-30',
      participants: 1800,
      rating: 4.8,
      features: ['Lãi suất 0%', 'Trả góp 12 tháng', 'Thủ tục đơn giản', 'Phê duyệt nhanh'],
      terms: [
        'Áp dụng cho sản phẩm từ 20 triệu',
        'Cần chứng minh thu nhập',
        'Phí dịch vụ 2%'
      ]
    }
  ];

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      // Mock data for now - in real app, this would come from API
      setDeals(dealData);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDealIcon = (type) => {
    switch (type) {
      case 'flash-sale':
        return Flame;
      case 'combo':
        return Gift;
      case 'new-user':
        return Users;
      case 'seasonal':
        return Calendar;
      case 'trade-in':
        return ArrowRight;
      case 'installment':
        return Percent;
      default:
        return Tag;
    }
  };

  const getDealTypeText = (type) => {
    switch (type) {
      case 'flash-sale':
        return 'Flash Sale';
      case 'combo':
        return 'Combo Deal';
      case 'new-user':
        return 'Người dùng mới';
      case 'seasonal':
        return 'Khuyến mãi mùa';
      case 'trade-in':
        return 'Đổi cũ lấy mới';
      case 'installment':
        return 'Trả góp';
      default:
        return 'Ưu đãi';
    }
  };

  const DealCard = ({ deal }) => {
    const IconComponent = getDealIcon(deal.type);
    
    return (
      <div 
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
        onClick={() => setSelectedDeal(deal)}
      >
        <div className="relative">
          <img 
            src={deal.image || '/placeholder-deal.jpg'} 
            alt={deal.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className={`absolute top-3 left-3 bg-gradient-to-r ${deal.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
            {getDealTypeText(deal.type)}
          </div>
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
            -{deal.discount}%
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{deal.brand}</span>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{deal.rating}</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {deal.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {deal.description}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-red-600">{formatPrice(deal.salePrice)}</span>
              <span className="text-sm text-gray-500 line-through">{formatPrice(deal.originalPrice)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{deal.participants}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Còn lại: {Math.ceil((new Date(deal.validUntil) - new Date()) / (1000 * 60 * 60 * 24))} ngày</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>{deal.category}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
              Xem chi tiết
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DealDetail = ({ deal }) => {
    const IconComponent = getDealIcon(deal.type);
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className={`bg-gradient-to-r ${deal.color} p-4 rounded-xl`}>
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{deal.title}</h2>
            <p className="text-gray-600">{deal.brand} • {deal.category}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <img 
              src={deal.image || '/placeholder-deal.jpg'} 
              alt={deal.title}
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Thông tin ưu đãi</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá gốc:</span>
                  <span className="text-lg font-semibold line-through">{formatPrice(deal.originalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá ưu đãi:</span>
                  <span className="text-2xl font-bold text-red-600">{formatPrice(deal.salePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiết kiệm:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatPrice(deal.originalPrice - deal.salePrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giảm giá:</span>
                  <span className="text-lg font-semibold text-red-600">{deal.discount}%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Thống kê</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{deal.participants}</div>
                  <div className="text-sm text-gray-600">Người tham gia</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{deal.rating}</div>
                  <div className="text-sm text-gray-600">Đánh giá</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Đặc điểm nổi bật</h3>
            <div className="space-y-3">
              {deal.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Điều khoản</h3>
            <div className="space-y-2">
              {deal.terms.map((term, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <span className="text-gray-700 text-sm">{term}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-6 rounded-xl mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="h-6 w-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-900">Thời gian có hiệu lực</h3>
          </div>
          <p className="text-gray-700">
            Ưu đãi có hiệu lực đến ngày {new Date(deal.validUntil).toLocaleDateString('vi-VN')}
          </p>
        </div>
        
        <div className="flex space-x-4">
          <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Mua ngay
          </button>
          <Link 
            to={`/products?deal=${deal.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Xem sản phẩm
          </Link>
          <button 
            onClick={() => setSelectedDeal(null)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Ưu đãi hấp dẫn</h1>
            <p className="text-xl text-orange-100">
              Không bỏ lỡ những cơ hội mua sắm với giá tốt nhất
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedDeal ? (
          <DealDetail deal={selectedDeal} />
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-red-600">6</div>
                <div className="text-gray-600">Ưu đãi đang diễn ra</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-green-600">9,890</div>
                <div className="text-gray-600">Người tham gia</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-purple-600">25%</div>
                <div className="text-gray-600">Giảm giá TB</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-orange-600">4.7</div>
                <div className="text-gray-600">Đánh giá TB</div>
              </div>
            </div>

            {/* Deals Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {deals.map(deal => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
