import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  BookOpen, 
  Video, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Shield,
  CreditCard,
  Truck,
  RotateCcw,
  Settings,
  Zap,
  Car,
  Battery,
  HelpCircle,
  ArrowRight,
  Star,
  ThumbsUp,
  Eye
} from 'lucide-react';

export const Help = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const helpCategories = [
    {
      id: 'getting-started',
      name: 'Bắt đầu',
      icon: Zap,
      color: 'from-blue-500 to-blue-600',
      articles: [
        {
          id: 'how-to-register',
          title: 'Cách đăng ký tài khoản',
          content: 'Hướng dẫn chi tiết cách tạo tài khoản mới trên EV Market...',
          type: 'guide'
        },
        {
          id: 'first-purchase',
          title: 'Mua sắm lần đầu',
          content: 'Hướng dẫn cho người dùng mới cách mua sản phẩm đầu tiên...',
          type: 'guide'
        },
        {
          id: 'account-verification',
          title: 'Xác thực tài khoản',
          content: 'Cách xác thực tài khoản để tăng độ tin cậy...',
          type: 'guide'
        }
      ]
    },
    {
      id: 'buying',
      name: 'Mua hàng',
      icon: CreditCard,
      color: 'from-green-500 to-green-600',
      articles: [
        {
          id: 'how-to-buy',
          title: 'Cách mua sản phẩm',
          content: 'Hướng dẫn từng bước để mua sản phẩm trên EV Market...',
          type: 'guide'
        },
        {
          id: 'payment-methods',
          title: 'Phương thức thanh toán',
          content: 'Các phương thức thanh toán được hỗ trợ...',
          type: 'info'
        },
        {
          id: 'price-negotiation',
          title: 'Thương lượng giá',
          content: 'Cách thương lượng giá với người bán...',
          type: 'tip'
        }
      ]
    },
    {
      id: 'selling',
      name: 'Bán hàng',
      icon: Car,
      color: 'from-purple-500 to-purple-600',
      articles: [
        {
          id: 'how-to-sell',
          title: 'Cách đăng bán sản phẩm',
          content: 'Hướng dẫn tạo tin đăng bán sản phẩm...',
          type: 'guide'
        },
        {
          id: 'product-photos',
          title: 'Chụp ảnh sản phẩm',
          content: 'Mẹo chụp ảnh sản phẩm đẹp và thu hút...',
          type: 'tip'
        },
        {
          id: 'pricing-strategy',
          title: 'Chiến lược định giá',
          content: 'Cách định giá sản phẩm phù hợp với thị trường...',
          type: 'tip'
        }
      ]
    },
    {
      id: 'shipping',
      name: 'Vận chuyển',
      icon: Truck,
      color: 'from-orange-500 to-orange-600',
      articles: [
        {
          id: 'shipping-options',
          title: 'Tùy chọn vận chuyển',
          content: 'Các phương thức vận chuyển có sẵn...',
          type: 'info'
        },
        {
          id: 'shipping-cost',
          title: 'Chi phí vận chuyển',
          content: 'Cách tính chi phí vận chuyển...',
          type: 'info'
        },
        {
          id: 'tracking-order',
          title: 'Theo dõi đơn hàng',
          content: 'Cách theo dõi trạng thái đơn hàng...',
          type: 'guide'
        }
      ]
    },
    {
      id: 'returns',
      name: 'Đổi trả',
      icon: RotateCcw,
      color: 'from-red-500 to-red-600',
      articles: [
        {
          id: 'return-policy',
          title: 'Chính sách đổi trả',
          content: 'Điều kiện và quy trình đổi trả sản phẩm...',
          type: 'info'
        },
        {
          id: 'how-to-return',
          title: 'Cách yêu cầu đổi trả',
          content: 'Hướng dẫn tạo yêu cầu đổi trả...',
          type: 'guide'
        },
        {
          id: 'refund-process',
          title: 'Quy trình hoàn tiền',
          content: 'Thời gian và cách thức hoàn tiền...',
          type: 'info'
        }
      ]
    },
    {
      id: 'account',
      name: 'Tài khoản',
      icon: Settings,
      color: 'from-indigo-500 to-indigo-600',
      articles: [
        {
          id: 'profile-settings',
          title: 'Cài đặt hồ sơ',
          content: 'Cách chỉnh sửa thông tin cá nhân...',
          type: 'guide'
        },
        {
          id: 'password-change',
          title: 'Đổi mật khẩu',
          content: 'Hướng dẫn thay đổi mật khẩu tài khoản...',
          type: 'guide'
        },
        {
          id: 'account-security',
          title: 'Bảo mật tài khoản',
          content: 'Các biện pháp bảo mật tài khoản...',
          type: 'tip'
        }
      ]
    }
  ];

  const popularArticles = [
    {
      id: 'most-popular-1',
      title: 'Cách mua sản phẩm an toàn',
      category: 'Mua hàng',
      views: 15420,
      helpful: 98
    },
    {
      id: 'most-popular-2',
      title: 'Hướng dẫn đăng bán sản phẩm',
      category: 'Bán hàng',
      views: 12850,
      helpful: 95
    },
    {
      id: 'most-popular-3',
      title: 'Chính sách đổi trả và hoàn tiền',
      category: 'Đổi trả',
      views: 11200,
      helpful: 92
    },
    {
      id: 'most-popular-4',
      title: 'Các phương thức thanh toán',
      category: 'Mua hàng',
      views: 9800,
      helpful: 89
    },
    {
      id: 'most-popular-5',
      title: 'Bảo mật tài khoản và thông tin',
      category: 'Tài khoản',
      views: 8750,
      helpful: 87
    }
  ];

  const contactMethods = [
    {
      id: 'live-chat',
      name: 'Chat trực tuyến',
      description: 'Hỗ trợ 24/7 qua chat',
      icon: MessageCircle,
      color: 'from-blue-500 to-blue-600',
      available: true,
      responseTime: 'Trong vài phút'
    },
    {
      id: 'phone',
      name: 'Điện thoại',
      description: 'Gọi hotline hỗ trợ',
      icon: Phone,
      color: 'from-green-500 to-green-600',
      available: true,
      responseTime: 'Ngay lập tức',
      contact: '+84 1900 1234'
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Gửi email hỗ trợ',
      icon: Mail,
      color: 'from-purple-500 to-purple-600',
      available: true,
      responseTime: 'Trong 24h',
      contact: 'support@evmarket.vn'
    },
    {
      id: 'ticket',
      name: 'Tạo ticket',
      description: 'Tạo yêu cầu hỗ trợ',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      available: true,
      responseTime: 'Trong 12h'
    }
  ];

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getArticleIcon = (type) => {
    switch (type) {
      case 'guide':
        return BookOpen;
      case 'tip':
        return Lightbulb;
      case 'info':
        return Info;
      default:
        return FileText;
    }
  };

  const getArticleColor = (type) => {
    switch (type) {
      case 'guide':
        return 'text-blue-600';
      case 'tip':
        return 'text-yellow-600';
      case 'info':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredCategories = helpCategories.filter(category => {
    if (!searchTerm) return true;
    return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.articles.some(article => 
             article.title.toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Trung tâm trợ giúp</h1>
            <p className="text-xl text-blue-100">
              Tìm câu trả lời cho mọi thắc mắc của bạn
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm câu trả lời..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Help Categories */}
            <div className="space-y-6">
              {filteredCategories.map(category => {
                const IconComponent = category.icon;
                return (
                  <div key={category.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div 
                      className={`bg-gradient-to-r ${category.color} p-6 text-white cursor-pointer`}
                      onClick={() => toggleExpanded(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{category.name}</h3>
                            <p className="text-white/80 text-sm">{category.articles.length} bài viết</p>
                          </div>
                        </div>
                        {expandedItems.has(category.id) ? (
                          <ChevronDown className="h-6 w-6" />
                        ) : (
                          <ChevronRight className="h-6 w-6" />
                        )}
                      </div>
                    </div>
                    
                    {expandedItems.has(category.id) && (
                      <div className="p-6">
                        <div className="space-y-4">
                          {category.articles.map(article => {
                            const ArticleIcon = getArticleIcon(article.type);
                            return (
                              <div key={article.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                <ArticleIcon className={`h-5 w-5 mt-1 ${getArticleColor(article.type)}`} />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                                  <p className="text-sm text-gray-600">{article.content}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Popular Articles */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Bài viết phổ biến</h3>
              <div className="space-y-4">
                {popularArticles.map(article => (
                  <div key={article.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                      <p className="text-sm text-gray-600">{article.category}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{article.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{article.helpful}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Methods */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Liên hệ hỗ trợ</h3>
              <div className="space-y-4">
                {contactMethods.map(method => {
                  const IconComponent = method.icon;
                  return (
                    <div key={method.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className={`bg-gradient-to-r ${method.color} p-3 rounded-xl`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{method.name}</h4>
                        <p className="text-sm text-gray-600">{method.description}</p>
                        {method.contact && (
                          <p className="text-sm font-medium text-blue-600">{method.contact}</p>
                        )}
                        <p className="text-xs text-gray-500">Phản hồi: {method.responseTime}</p>
                      </div>
                      {method.available && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Thống kê hỗ trợ</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tổng bài viết</span>
                  <span className="font-semibold text-blue-600">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Câu hỏi đã giải đáp</span>
                  <span className="font-semibold text-green-600">12,450</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Thời gian phản hồi TB</span>
                  <span className="font-semibold text-purple-600">2.5h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Đánh giá hài lòng</span>
                  <span className="font-semibold text-orange-600">98%</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-bold text-red-900">Hỗ trợ khẩn cấp</h3>
              </div>
              <p className="text-sm text-red-700 mb-4">
                Nếu bạn gặp vấn đề nghiêm trọng hoặc cần hỗ trợ ngay lập tức
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">+84 1900 1234</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">emergency@evmarket.vn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
