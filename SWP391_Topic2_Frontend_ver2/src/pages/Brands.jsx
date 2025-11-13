import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  Eye, 
  MapPin, 
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Shield,
  Zap,
  Car,
  Battery,
  Settings,
  ArrowRight,
  CheckCircle,
  Globe,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { formatPrice } from '../utils/formatters';

export const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const brandData = [
    {
      id: 'vinfast',
      name: 'VinFast',
      logo: '/brands/vinfast-logo.png',
      description: 'Thương hiệu xe điện Việt Nam hàng đầu với công nghệ tiên tiến',
      country: 'Việt Nam',
      founded: '2017',
      color: 'from-blue-500 to-blue-700',
      stats: { 
        totalProducts: 450, 
        avgPrice: 35000000, 
        rating: 4.8,
        growth: '+25%',
        marketShare: '35%'
      },
      features: ['Công nghệ AI', 'Pin lithium-ion', 'Thiết kế hiện đại', 'Bảo hành 5 năm'],
      categories: ['Xe máy điện', 'Xe đạp điện', 'Pin xe điện'],
      contact: {
        website: 'www.vinfast.vn',
        phone: '+84 1900 232389',
        email: 'support@vinfast.vn'
      }
    },
    {
      id: 'honda',
      name: 'Honda',
      logo: '/brands/honda-logo.png',
      description: 'Hãng xe máy Nhật Bản với hơn 70 năm kinh nghiệm',
      country: 'Nhật Bản',
      founded: '1948',
      color: 'from-red-500 to-red-700',
      stats: { 
        totalProducts: 320, 
        avgPrice: 28000000, 
        rating: 4.7,
        growth: '+18%',
        marketShare: '28%'
      },
      features: ['Động cơ bền bỉ', 'Tiết kiệm nhiên liệu', 'Dịch vụ tốt', 'Phụ tùng chính hãng'],
      categories: ['Xe máy điện', 'Phụ kiện'],
      contact: {
        website: 'www.honda.com.vn',
        phone: '+84 1900 1234',
        email: 'info@honda.com.vn'
      }
    },
    {
      id: 'yamaha',
      name: 'Yamaha',
      logo: '/brands/yamaha-logo.png',
      description: 'Thương hiệu xe máy Nhật Bản nổi tiếng với chất lượng cao',
      country: 'Nhật Bản',
      founded: '1955',
      color: 'from-yellow-500 to-orange-600',
      stats: { 
        totalProducts: 280, 
        avgPrice: 26000000, 
        rating: 4.6,
        growth: '+15%',
        marketShare: '22%'
      },
      features: ['Động cơ mạnh mẽ', 'Thiết kế thể thao', 'Công nghệ tiên tiến', 'Giá cả hợp lý'],
      categories: ['Xe máy điện', 'Xe đạp điện'],
      contact: {
        website: 'www.yamaha-motor.com.vn',
        phone: '+84 1900 5678',
        email: 'contact@yamaha.com.vn'
      }
    },
    {
      id: 'sym',
      name: 'SYM',
      logo: '/brands/sym-logo.png',
      description: 'Thương hiệu xe máy Đài Loan với giá cả cạnh tranh',
      country: 'Đài Loan',
      founded: '1954',
      color: 'from-green-500 to-green-700',
      stats: { 
        totalProducts: 180, 
        avgPrice: 18000000, 
        rating: 4.4,
        growth: '+20%',
        marketShare: '15%'
      },
      features: ['Giá cả hợp lý', 'Tiết kiệm nhiên liệu', 'Dễ bảo trì', 'Phụ tùng rẻ'],
      categories: ['Xe máy điện', 'Phụ kiện'],
      contact: {
        website: 'www.sym.com.tw',
        phone: '+84 1900 9999',
        email: 'info@sym.com.tw'
      }
    },
    {
      id: 'piaggio',
      name: 'Piaggio',
      logo: '/brands/piaggio-logo.png',
      description: 'Thương hiệu xe máy Ý với thiết kế sang trọng',
      country: 'Ý',
      founded: '1884',
      color: 'from-purple-500 to-purple-700',
      stats: { 
        totalProducts: 120, 
        avgPrice: 42000000, 
        rating: 4.5,
        growth: '+12%',
        marketShare: '8%'
      },
      features: ['Thiết kế sang trọng', 'Chất lượng cao', 'Công nghệ châu Âu', 'Độ bền cao'],
      categories: ['Xe máy điện'],
      contact: {
        website: 'www.piaggio.com',
        phone: '+84 1900 8888',
        email: 'support@piaggio.com'
      }
    },
    {
      id: 'tesla',
      name: 'Tesla',
      logo: '/brands/tesla-logo.png',
      description: 'Thương hiệu xe điện Mỹ tiên phong trong công nghệ',
      country: 'Mỹ',
      founded: '2003',
      color: 'from-gray-600 to-gray-800',
      stats: { 
        totalProducts: 85, 
        avgPrice: 120000000, 
        rating: 4.9,
        growth: '+30%',
        marketShare: '5%'
      },
      features: ['Công nghệ tự lái', 'Pin tiên tiến', 'Thiết kế tương lai', 'Hiệu suất cao'],
      categories: ['Xe máy điện', 'Pin xe điện', 'Bộ sạc'],
      contact: {
        website: 'www.tesla.com',
        phone: '+84 1900 7777',
        email: 'support@tesla.com'
      }
    }
  ];

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      // Mock data for now - in real app, this would come from API
      setBrands(brandData);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const BrandCard = ({ brand }) => (
    <div 
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
      onClick={() => setSelectedBrand(brand)}
    >
      <div className={`bg-gradient-to-r ${brand.color} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Car className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{brand.name}</h3>
              <p className="text-white/80 text-sm">{brand.country} • {brand.founded}</p>
            </div>
          </div>
          <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
      
      <div className="p-6">
        <p className="text-gray-600 mb-4 text-sm">{brand.description}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{brand.stats.totalProducts}</div>
            <div className="text-sm text-gray-500">Sản phẩm</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{formatPrice(brand.stats.avgPrice)}</div>
            <div className="text-sm text-gray-500">Giá TB</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{brand.stats.rating}</span>
          </div>
          <div className="text-sm text-gray-500">
            Thị phần: {brand.stats.marketShare}
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm">Danh mục:</h4>
          <div className="flex flex-wrap gap-1">
            {brand.categories.map((category, index) => (
              <span 
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const BrandDetail = ({ brand }) => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center space-x-4 mb-6">
        <div className={`bg-gradient-to-r ${brand.color} p-4 rounded-xl`}>
          <Car className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{brand.name}</h2>
          <p className="text-gray-600">{brand.country} • Thành lập {brand.founded}</p>
        </div>
      </div>
      
      <p className="text-gray-700 mb-8 text-lg">{brand.description}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-xl text-center">
          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{brand.stats.totalProducts}</div>
          <div className="text-sm text-gray-600">Sản phẩm</div>
        </div>
        <div className="bg-green-50 p-6 rounded-xl text-center">
          <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{formatPrice(brand.stats.avgPrice)}</div>
          <div className="text-sm text-gray-600">Giá TB</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-xl text-center">
          <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-600">{brand.stats.rating}</div>
          <div className="text-sm text-gray-600">Đánh giá</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl text-center">
          <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">{brand.stats.growth}</div>
          <div className="text-sm text-gray-600">Tăng trưởng</div>
        </div>
        <div className="bg-orange-50 p-6 rounded-xl text-center">
          <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600">{brand.stats.marketShare}</div>
          <div className="text-sm text-gray-600">Thị phần</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Đặc điểm nổi bật</h3>
          <div className="space-y-3">
            {brand.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Danh mục sản phẩm</h3>
          <div className="space-y-2">
            {brand.categories.map((category, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-xl mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Thông tin liên hệ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-blue-600" />
            <span className="text-gray-700">{brand.contact.website}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-green-600" />
            <span className="text-gray-700">{brand.contact.phone}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-purple-600" />
            <span className="text-gray-700">{brand.contact.email}</span>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-4">
        <Link 
          to={`/products?brand=${brand.id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Xem sản phẩm {brand.name}
        </Link>
        <button 
          onClick={() => setSelectedBrand(null)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Quay lại
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Thương hiệu</h1>
            <p className="text-xl text-blue-100">
              Khám phá các thương hiệu xe điện hàng đầu thế giới
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedBrand ? (
          <BrandDetail brand={selectedBrand} />
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-blue-600">6</div>
                <div className="text-gray-600">Thương hiệu</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-green-600">1,435</div>
                <div className="text-gray-600">Tổng sản phẩm</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-purple-600">4.7</div>
                <div className="text-gray-600">Đánh giá TB</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-orange-600">20%</div>
                <div className="text-gray-600">Tăng trưởng TB</div>
              </div>
            </div>

            {/* Brands Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {brands.map(brand => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
