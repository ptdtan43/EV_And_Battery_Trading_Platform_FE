import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  Bike, 
  Battery, 
  Settings, 
  Zap,
  ArrowRight,
  Star,
  Eye,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { formatPrice } from '../utils/formatters';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categoryData = [
    {
      id: 'xe-may-dien',
      name: 'Xe máy điện',
      icon: Car,
      description: 'Các dòng xe máy điện hiện đại, tiết kiệm năng lượng',
      color: 'from-blue-500 to-blue-600',
      stats: { total: 1250, avgPrice: 25000000, growth: '+15%' },
      features: ['Pin lithium-ion', 'Tốc độ cao', 'Tiết kiệm điện', 'Thiết kế hiện đại']
    },
    {
      id: 'xe-dap-dien',
      name: 'Xe đạp điện',
      icon: Bike,
      description: 'Xe đạp điện gọn nhẹ, phù hợp cho di chuyển trong thành phố',
      color: 'from-green-500 to-green-600',
      stats: { total: 890, avgPrice: 12000000, growth: '+22%' },
      features: ['Trọng lượng nhẹ', 'Dễ điều khiển', 'Phù hợp thành phố', 'Giá cả hợp lý']
    },
    {
      id: 'pin-xe-dien',
      name: 'Pin xe điện',
      icon: Battery,
      description: 'Pin lithium-ion chất lượng cao cho xe điện',
      color: 'from-purple-500 to-purple-600',
      stats: { total: 450, avgPrice: 8000000, growth: '+18%' },
      features: ['Tuổi thọ cao', 'Sạc nhanh', 'An toàn', 'Bảo hành dài hạn']
    },
    {
      id: 'phu-kien',
      name: 'Phụ kiện',
      icon: Settings,
      description: 'Phụ kiện và đồ chơi cho xe điện',
      color: 'from-orange-500 to-orange-600',
      stats: { total: 320, avgPrice: 2000000, growth: '+25%' },
      features: ['Đa dạng mẫu mã', 'Chất lượng tốt', 'Giá rẻ', 'Dễ lắp đặt']
    },
    {
      id: 'bo-sac',
      name: 'Bộ sạc',
      icon: Zap,
      description: 'Bộ sạc và thiết bị sạc cho xe điện',
      color: 'from-red-500 to-red-600',
      stats: { total: 180, avgPrice: 3500000, growth: '+12%' },
      features: ['Sạc nhanh', 'Tiết kiệm điện', 'An toàn', 'Tương thích cao']
    }
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // Mock data for now - in real app, this would come from API
      setCategories(categoryData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const CategoryCard = ({ category }) => {
    const IconComponent = category.icon;
    
    return (
      <div 
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
        onClick={() => setSelectedCategory(category)}
      >
        <div className={`bg-gradient-to-r ${category.color} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <IconComponent className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{category.name}</h3>
                <p className="text-white/80 text-sm">{category.description}</p>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{category.stats.total}</div>
              <div className="text-sm text-gray-500">Sản phẩm</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatPrice(category.stats.avgPrice)}</div>
              <div className="text-sm text-gray-500">Giá TB</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{category.stats.growth}</div>
              <div className="text-sm text-gray-500">Tăng trưởng</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 mb-2">Đặc điểm nổi bật:</h4>
            <div className="flex flex-wrap gap-2">
              {category.features.map((feature, index) => (
                <span 
                  key={index}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link 
              to={`/products?category=${category.id}`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center block transition-colors"
            >
              Xem sản phẩm
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const CategoryDetail = ({ category }) => {
    const IconComponent = category.icon;
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className={`bg-gradient-to-r ${category.color} p-4 rounded-xl`}>
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{category.name}</h2>
            <p className="text-gray-600">{category.description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-xl text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{category.stats.total}</div>
            <div className="text-sm text-gray-600">Tổng sản phẩm</div>
          </div>
          <div className="bg-green-50 p-6 rounded-xl text-center">
            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{formatPrice(category.stats.avgPrice)}</div>
            <div className="text-sm text-gray-600">Giá trung bình</div>
          </div>
          <div className="bg-purple-50 p-6 rounded-xl text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{category.stats.growth}</div>
            <div className="text-sm text-gray-600">Tăng trưởng</div>
          </div>
          <div className="bg-orange-50 p-6 rounded-xl text-center">
            <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">4.8</div>
            <div className="text-sm text-gray-600">Đánh giá TB</div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Đặc điểm nổi bật</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <Link 
            to={`/products?category=${category.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Xem tất cả sản phẩm
          </Link>
          <button 
            onClick={() => setSelectedCategory(null)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
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
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Danh mục sản phẩm</h1>
            <p className="text-xl text-blue-100">
              Khám phá các danh mục xe điện và phụ kiện đa dạng
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedCategory ? (
          <CategoryDetail category={selectedCategory} />
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-blue-600">5</div>
                <div className="text-gray-600">Danh mục chính</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-green-600">3,090</div>
                <div className="text-gray-600">Tổng sản phẩm</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-purple-600">15M+</div>
                <div className="text-gray-600">Giá trung bình</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="text-3xl font-bold text-orange-600">18%</div>
                <div className="text-gray-600">Tăng trưởng TB</div>
              </div>
            </div>

            {/* Categories Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map(category => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
