import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  Eye, 
  MapPin, 
  Calendar,
  User,
  ThumbsUp,
  MessageCircle,
  Filter,
  Search,
  ChevronDown,
  CheckCircle,
  Award,
  TrendingUp,
  Users,
  Zap,
  Car,
  Battery,
  Settings,
  ArrowRight,
  Heart,
  Share2,
  Flag
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { formatPrice } from '../utils/formatters';

export const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'Xe máy điện', 'Xe đạp điện', 'Pin xe điện', 'Phụ kiện', 'Bộ sạc'
  ];

  const reviewData = [
    {
      id: 1,
      user: {
        name: 'Nguyễn Văn An',
        avatar: '/avatars/user1.jpg',
        location: 'Hà Nội',
        verified: true
      },
      product: {
        name: 'VinFast VF8',
        brand: 'VinFast',
        category: 'Xe máy điện',
        price: 35000000,
        image: '/products/vinfast-vf8.jpg'
      },
      rating: 5,
      title: 'Xe điện tuyệt vời, rất hài lòng!',
      content: 'Tôi đã sử dụng VinFast VF8 được 6 tháng và rất hài lòng. Xe chạy êm, pin bền, thiết kế đẹp. Dịch vụ hậu mãi cũng rất tốt. Khuyến nghị mọi người nên mua.',
      images: ['/reviews/review1-1.jpg', '/reviews/review1-2.jpg'],
      helpful: 24,
      comments: 8,
      date: '2024-11-15',
      verified: true,
      tags: ['Chất lượng tốt', 'Giá hợp lý', 'Dịch vụ tốt']
    },
    {
      id: 2,
      user: {
        name: 'Trần Thị Bình',
        avatar: '/avatars/user2.jpg',
        location: 'TP.HCM',
        verified: true
      },
      product: {
        name: 'Honda PCX Electric',
        brand: 'Honda',
        category: 'Xe máy điện',
        price: 28000000,
        image: '/products/honda-pcx-electric.jpg'
      },
      rating: 4,
      title: 'Xe tốt nhưng pin hơi yếu',
      content: 'Xe Honda PCX Electric chạy rất êm và ổn định. Tuy nhiên, pin chỉ đi được khoảng 60km trong điều kiện thành phố. Nếu Honda cải thiện pin thì sẽ hoàn hảo.',
      images: ['/reviews/review2-1.jpg'],
      helpful: 18,
      comments: 12,
      date: '2024-11-10',
      verified: true,
      tags: ['Chạy êm', 'Pin yếu', 'Thiết kế đẹp']
    },
    {
      id: 3,
      user: {
        name: 'Lê Minh Cường',
        avatar: '/avatars/user3.jpg',
        location: 'Đà Nẵng',
        verified: false
      },
      product: {
        name: 'Pin Lithium-ion 72V',
        brand: 'CATL',
        category: 'Pin xe điện',
        price: 8000000,
        image: '/products/catl-battery.jpg'
      },
      rating: 5,
      title: 'Pin chất lượng cao, tuổi thọ lâu',
      content: 'Sử dụng pin CATL được 1 năm, hiệu suất vẫn rất tốt. Sạc nhanh, không bị chai pin. Giá hơi cao nhưng chất lượng xứng đáng.',
      images: [],
      helpful: 15,
      comments: 5,
      date: '2024-11-08',
      verified: false,
      tags: ['Chất lượng cao', 'Tuổi thọ lâu', 'Giá cao']
    },
    {
      id: 4,
      user: {
        name: 'Phạm Thị Dung',
        avatar: '/avatars/user4.jpg',
        location: 'Cần Thơ',
        verified: true
      },
      product: {
        name: 'Yamaha E-Vino',
        brand: 'Yamaha',
        category: 'Xe đạp điện',
        price: 12000000,
        image: '/products/yamaha-e-vino.jpg'
      },
      rating: 4,
      title: 'Xe đạp điện phù hợp cho nữ',
      content: 'Yamaha E-Vino rất phù hợp cho phụ nữ. Xe nhẹ, dễ điều khiển, thiết kế xinh xắn. Pin đi được khoảng 50km, đủ cho việc đi lại trong thành phố.',
      images: ['/reviews/review4-1.jpg', '/reviews/review4-2.jpg'],
      helpful: 22,
      comments: 7,
      date: '2024-11-05',
      verified: true,
      tags: ['Phù hợp nữ', 'Dễ điều khiển', 'Thiết kế đẹp']
    },
    {
      id: 5,
      user: {
        name: 'Hoàng Văn Em',
        avatar: '/avatars/user5.jpg',
        location: 'Hải Phòng',
        verified: true
      },
      product: {
        name: 'Bộ sạc nhanh 3KW',
        brand: 'Delta',
        category: 'Bộ sạc',
        price: 3500000,
        image: '/products/delta-charger.jpg'
      },
      rating: 3,
      title: 'Sạc nhanh nhưng hay bị lỗi',
      content: 'Bộ sạc Delta sạc khá nhanh, từ 0-80% chỉ mất 2 tiếng. Tuy nhiên, đã bị lỗi 2 lần trong 8 tháng sử dụng. Dịch vụ bảo hành tốt nhưng hơi phiền.',
      images: ['/reviews/review5-1.jpg'],
      helpful: 12,
      comments: 9,
      date: '2024-11-03',
      verified: true,
      tags: ['Sạc nhanh', 'Hay lỗi', 'Bảo hành tốt']
    },
    {
      id: 6,
      user: {
        name: 'Vũ Thị Phương',
        avatar: '/avatars/user6.jpg',
        location: 'Nha Trang',
        verified: true
      },
      product: {
        name: 'SYM E-Bonus',
        brand: 'SYM',
        category: 'Xe máy điện',
        price: 18000000,
        image: '/products/sym-e-bonus.jpg'
      },
      rating: 4,
      title: 'Giá rẻ, chất lượng ổn',
      content: 'SYM E-Bonus có giá rẻ nhất trong phân khúc xe máy điện. Chất lượng ổn, chạy êm, tiết kiệm điện. Phù hợp với người có thu nhập trung bình.',
      images: [],
      helpful: 19,
      comments: 6,
      date: '2024-11-01',
      verified: true,
      tags: ['Giá rẻ', 'Chất lượng ổn', 'Tiết kiệm điện']
    }
  ];

  useEffect(() => {
    loadReviews();
  }, [selectedRating, selectedCategory, sortBy]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      // Mock data for now - in real app, this would come from API
      setReviews(reviewData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = !selectedRating || review.rating === parseInt(selectedRating);
    const matchesCategory = !selectedCategory || review.product.category === selectedCategory;
    
    return matchesSearch && matchesRating && matchesCategory;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date) - new Date(a.date);
      case 'oldest':
        return new Date(a.date) - new Date(b.date);
      case 'highest-rating':
        return b.rating - a.rating;
      case 'lowest-rating':
        return a.rating - b.rating;
      case 'most-helpful':
        return b.helpful - a.helpful;
      default:
        return 0;
    }
  });

  const getOverallStats = () => {
    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const totalHelpful = reviews.reduce((sum, review) => sum + review.helpful, 0);
    const verifiedReviews = reviews.filter(review => review.verified).length;
    
    return { totalReviews, avgRating, totalHelpful, verifiedReviews };
  };

  const stats = getOverallStats();

  const ReviewCard = ({ review }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
      <div className="flex items-start space-x-4 mb-4">
        <img 
          src={review.user.avatar || '/placeholder-avatar.jpg'} 
          alt={review.user.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900">{review.user.name}</h3>
            {review.user.verified && (
              <CheckCircle className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{review.user.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(review.date).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
            />
          ))}
        </div>
        <h4 className="font-semibold text-gray-900">{review.title}</h4>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex items-center space-x-3 mb-2">
          <img 
            src={review.product.image || '/placeholder-product.jpg'} 
            alt={review.product.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div>
            <h5 className="font-medium text-gray-900">{review.product.name}</h5>
            <p className="text-sm text-gray-600">{review.product.brand} • {review.product.category}</p>
            <p className="text-sm font-semibold text-blue-600">{formatPrice(review.product.price)}</p>
          </div>
        </div>
      </div>

      <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>

      {review.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {review.images.map((image, index) => (
            <img 
              key={index}
              src={image} 
              alt={`Review image ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {review.tags.map((tag, index) => (
          <span 
            key={index}
            className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
            <ThumbsUp className="h-4 w-4" />
            <span>{review.helpful}</span>
          </button>
          <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span>{review.comments}</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 className="h-4 w-4 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Flag className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Đánh giá sản phẩm</h1>
            <p className="text-xl text-blue-100">
              Chia sẻ trải nghiệm và đọc đánh giá từ cộng đồng
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalReviews}</div>
            <div className="text-gray-600">Tổng đánh giá</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</div>
            <div className="text-gray-600">Đánh giá TB</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalHelpful}</div>
            <div className="text-gray-600">Hữu ích</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.verifiedReviews}</div>
            <div className="text-gray-600">Đã xác thực</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm đánh giá..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>Bộ lọc</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest-rating">Đánh giá cao nhất</option>
              <option value="lowest-rating">Đánh giá thấp nhất</option>
              <option value="most-helpful">Hữu ích nhất</option>
            </select>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá</label>
                  <select
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả đánh giá</option>
                    <option value="5">5 sao</option>
                    <option value="4">4 sao</option>
                    <option value="3">3 sao</option>
                    <option value="2">2 sao</option>
                    <option value="1">1 sao</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Hiển thị <span className="font-semibold text-blue-600">{sortedReviews.length}</span> đánh giá
          </p>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedReviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {!loading && sortedReviews.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Không tìm thấy đánh giá</h3>
            <p className="text-gray-500">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>
    </div>
  );
};
