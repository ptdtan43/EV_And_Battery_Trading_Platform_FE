import { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail,
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
  Star,
  ThumbsUp,
  Eye,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react';

export const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [helpfulVotes, setHelpfulVotes] = useState(new Set());

  const faqCategories = [
    {
      id: 'general',
      name: 'Câu hỏi chung',
      icon: HelpCircle,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'account',
      name: 'Tài khoản',
      icon: Settings,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'buying',
      name: 'Mua hàng',
      icon: CreditCard,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'selling',
      name: 'Bán hàng',
      icon: Car,
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'shipping',
      name: 'Vận chuyển',
      icon: Truck,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'returns',
      name: 'Đổi trả',
      icon: RotateCcw,
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'payment',
      name: 'Thanh toán',
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'security',
      name: 'Bảo mật',
      icon: Shield,
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const faqData = [
    {
      id: 1,
      category: 'general',
      question: 'EV Market là gì?',
      answer: 'EV Market là nền tảng giao dịch xe điện và phụ kiện số 1 Việt Nam. Chúng tôi kết nối người mua và người bán xe điện, pin xe điện, và các phụ kiện liên quan trong một môi trường an toàn và minh bạch.',
      helpful: 245,
      views: 12500,
      tags: ['giới thiệu', 'nền tảng', 'xe điện']
    },
    {
      id: 2,
      category: 'account',
      question: 'Làm thế nào để đăng ký tài khoản?',
      answer: 'Bạn có thể đăng ký tài khoản bằng cách: 1) Nhấn nút "Đăng ký" ở góc trên bên phải, 2) Điền thông tin cá nhân, 3) Xác thực email, 4) Hoàn tất hồ sơ cá nhân. Quá trình này chỉ mất vài phút.',
      helpful: 189,
      views: 8900,
      tags: ['đăng ký', 'tài khoản', 'hướng dẫn']
    },
    {
      id: 3,
      category: 'buying',
      question: 'Tôi có thể mua sản phẩm như thế nào?',
      answer: 'Để mua sản phẩm: 1) Tìm kiếm sản phẩm bạn muốn, 2) Xem chi tiết và liên hệ người bán, 3) Thương lượng giá và điều kiện, 4) Thanh toán và nhận hàng. Chúng tôi hỗ trợ nhiều phương thức thanh toán an toàn.',
      helpful: 156,
      views: 11200,
      tags: ['mua hàng', 'thanh toán', 'giao dịch']
    },
    {
      id: 4,
      category: 'selling',
      question: 'Làm thế nào để đăng bán sản phẩm?',
      answer: 'Để đăng bán: 1) Đăng nhập tài khoản, 2) Nhấn "Đăng tin mới", 3) Điền thông tin sản phẩm chi tiết, 4) Upload ảnh chất lượng cao, 5) Đặt giá và điều kiện bán, 6) Đăng tin và chờ duyệt. Tin đăng sẽ được kiểm duyệt trong 24h.',
      helpful: 203,
      views: 9800,
      tags: ['bán hàng', 'đăng tin', 'sản phẩm']
    },
    {
      id: 5,
      category: 'shipping',
      question: 'Các phương thức vận chuyển nào được hỗ trợ?',
      answer: 'Chúng tôi hỗ trợ nhiều phương thức vận chuyển: 1) Giao hàng tận nơi (COD), 2) Vận chuyển nhanh qua các đơn vị uy tín, 3) Tự vận chuyển (người mua đến lấy), 4) Vận chuyển quốc tế. Chi phí vận chuyển sẽ được tính dựa trên khoảng cách và trọng lượng.',
      helpful: 134,
      views: 7600,
      tags: ['vận chuyển', 'giao hàng', 'COD']
    },
    {
      id: 6,
      category: 'returns',
      question: 'Chính sách đổi trả như thế nào?',
      answer: 'Chúng tôi có chính sách đổi trả linh hoạt: 1) Đổi trả trong 7 ngày nếu sản phẩm không đúng mô tả, 2) Hoàn tiền 100% nếu sản phẩm bị lỗi từ nhà sản xuất, 3) Phí vận chuyển đổi trả do người mua chịu trừ trường hợp lỗi từ người bán. Liên hệ hỗ trợ để được hướng dẫn chi tiết.',
      helpful: 178,
      views: 8500,
      tags: ['đổi trả', 'hoàn tiền', 'chính sách']
    },
    {
      id: 7,
      category: 'payment',
      question: 'Các phương thức thanh toán nào được chấp nhận?',
      answer: 'Chúng tôi chấp nhận nhiều phương thức thanh toán: 1) Thanh toán khi nhận hàng (COD), 2) Chuyển khoản ngân hàng, 3) Ví điện tử (MoMo, ZaloPay, ViettelPay), 4) Thẻ tín dụng/ghi nợ, 5) Trả góp 0% lãi suất. Tất cả giao dịch đều được bảo mật và mã hóa.',
      helpful: 167,
      views: 9200,
      tags: ['thanh toán', 'COD', 'ví điện tử']
    },
    {
      id: 8,
      category: 'security',
      question: 'Thông tin cá nhân của tôi có được bảo mật không?',
      answer: 'Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của bạn: 1) Mã hóa SSL/TLS cho mọi giao dịch, 2) Không chia sẻ thông tin với bên thứ ba, 3) Tuân thủ Luật An toàn thông tin mạng, 4) Hệ thống bảo mật đa lớp. Bạn có thể yên tâm sử dụng dịch vụ.',
      helpful: 198,
      views: 10800,
      tags: ['bảo mật', 'thông tin', 'privacy']
    },
    {
      id: 9,
      category: 'general',
      question: 'EV Market có phí dịch vụ không?',
      answer: 'EV Market miễn phí cho người mua. Người bán chỉ trả phí dịch vụ khi giao dịch thành công: 1) Phí đăng tin: 0đ (miễn phí), 2) Phí giao dịch: 2% giá trị đơn hàng, 3) Phí quảng cáo: tùy chọn để tin đăng nổi bật. Chúng tôi cam kết minh bạch về mọi khoản phí.',
      helpful: 145,
      views: 6800,
      tags: ['phí dịch vụ', 'miễn phí', 'chi phí']
    },
    {
      id: 10,
      category: 'account',
      question: 'Làm thế nào để xác thực tài khoản?',
      answer: 'Xác thực tài khoản giúp tăng độ tin cậy: 1) Upload CMND/CCCD rõ nét, 2) Chụp ảnh selfie với giấy tờ, 3) Điền địa chỉ thường trú, 4) Chờ duyệt trong 24-48h. Tài khoản đã xác thực sẽ có badge xanh và được ưu tiên hiển thị.',
      helpful: 123,
      views: 5400,
      tags: ['xác thực', 'CMND', 'tin cậy']
    },
    {
      id: 11,
      category: 'buying',
      question: 'Tôi có thể thương lượng giá với người bán không?',
      answer: 'Có, bạn hoàn toàn có thể thương lượng giá: 1) Sử dụng tính năng "Đề nghị giá" trên trang sản phẩm, 2) Chat trực tiếp với người bán, 3) Đề xuất giá hợp lý dựa trên thị trường, 4) Thỏa thuận điều kiện giao hàng. Chúng tôi khuyến khích giao dịch minh bạch và công bằng.',
      helpful: 134,
      views: 7200,
      tags: ['thương lượng', 'giá cả', 'đề nghị']
    },
    {
      id: 12,
      category: 'selling',
      question: 'Làm sao để tin đăng của tôi được nhiều người xem?',
      answer: 'Để tin đăng thu hút nhiều người xem: 1) Chụp ảnh chất lượng cao và đầy đủ góc độ, 2) Viết mô tả chi tiết và hấp dẫn, 3) Đặt giá cạnh tranh với thị trường, 4) Sử dụng tính năng quảng cáo để tin nổi bật, 5) Cập nhật tin thường xuyên, 6) Phản hồi nhanh tin nhắn từ người mua.',
      helpful: 189,
      views: 8900,
      tags: ['quảng cáo', 'nổi bật', 'marketing']
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

  const toggleHelpful = (itemId) => {
    const newHelpful = new Set(helpfulVotes);
    if (newHelpful.has(itemId)) {
      newHelpful.delete(itemId);
    } else {
      newHelpful.add(itemId);
    }
    setHelpfulVotes(newHelpful);
  };

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryInfo = (categoryId) => {
    return faqCategories.find(cat => cat.id === categoryId);
  };

  const getCategoryStats = () => {
    const stats = {};
    faqCategories.forEach(category => {
      stats[category.id] = faqData.filter(faq => faq.category === category.id).length;
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Câu hỏi thường gặp</h1>
            <p className="text-xl text-blue-100">
              Tìm câu trả lời nhanh cho những thắc mắc phổ biến
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả danh mục</option>
              {faqCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({categoryStats[category.id]})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Danh mục</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === '' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Tất cả</span>
                    <span className="text-sm text-gray-500">{faqData.length}</span>
                  </div>
                </button>
                {faqCategories.map(category => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedCategory === category.id 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{category.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{categoryStats[category.id]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Hiển thị <span className="font-semibold text-blue-600">{filteredFAQs.length}</span> câu hỏi
                {selectedCategory && (
                  <span> trong danh mục <span className="font-semibold">{getCategoryInfo(selectedCategory)?.name}</span></span>
                )}
              </p>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFAQs.map(faq => {
                const categoryInfo = getCategoryInfo(faq.category);
                const IconComponent = categoryInfo?.icon || HelpCircle;
                const isExpanded = expandedItems.has(faq.id);
                const isHelpful = helpfulVotes.has(faq.id);
                
                return (
                  <div key={faq.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleExpanded(faq.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`bg-gradient-to-r ${categoryInfo?.color || 'from-gray-500 to-gray-600'} p-3 rounded-xl flex-shrink-0`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              categoryInfo?.color === 'from-blue-500 to-blue-600' ? 'bg-blue-100 text-blue-700' :
                              categoryInfo?.color === 'from-green-500 to-green-600' ? 'bg-green-100 text-green-700' :
                              categoryInfo?.color === 'from-purple-500 to-purple-600' ? 'bg-purple-100 text-purple-700' :
                              categoryInfo?.color === 'from-orange-500 to-orange-600' ? 'bg-orange-100 text-orange-700' :
                              categoryInfo?.color === 'from-indigo-500 to-indigo-600' ? 'bg-indigo-100 text-indigo-700' :
                              categoryInfo?.color === 'from-red-500 to-red-600' ? 'bg-red-100 text-red-700' :
                              categoryInfo?.color === 'from-yellow-500 to-yellow-600' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {categoryInfo?.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>{faq.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{faq.helpful}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-6 w-6 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-200">
                        <div className="pt-6">
                          <p className="text-gray-700 leading-relaxed mb-4">{faq.answer}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {faq.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleHelpful(faq.id);
                                }}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                  isHelpful 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span>{isHelpful ? 'Đã hữu ích' : 'Hữu ích'}</span>
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Câu hỏi #{faq.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Không tìm thấy câu hỏi</h3>
                <p className="text-gray-500">Hãy thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mt-12 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Không tìm thấy câu trả lời?</h3>
            <p className="text-blue-100 mb-6">
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Chat trực tuyến</span>
              </button>
              <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Gọi hotline</span>
              </button>
              <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Gửi email</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
