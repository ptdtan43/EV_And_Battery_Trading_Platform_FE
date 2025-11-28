import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Info,
  Users,
  Headphones,
  Globe,
  Calendar,
  Star,
  ThumbsUp,
  Award,
  Shield,
  Zap,
  Car,
  Battery,
  Settings,
  Truck,
  CreditCard,
  RotateCcw
} from 'lucide-react';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactMethods = [
    {
      id: 'phone',
      name: 'Điện thoại',
      description: 'Gọi trực tiếp để được hỗ trợ ngay lập tức',
      icon: Phone,
      color: 'from-green-500 to-green-600',
      contact: '+84 1900 1234',
      available: true,
      hours: '24/7',
      responseTime: 'Ngay lập tức'
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Gửi email chi tiết về vấn đề của bạn',
      icon: Mail,
      color: 'from-blue-500 to-blue-600',
      contact: 'support@evmarket.vn',
      available: true,
      hours: '24/7',
      responseTime: 'Trong 24h'
    },
    {
      id: 'live-chat',
      name: 'Chat trực tuyến',
      description: 'Chat với nhân viên hỗ trợ trực tuyến',
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600',
      contact: 'Bắt đầu chat',
      available: true,
      hours: '8:00 - 22:00',
      responseTime: 'Trong vài phút'
    },
    {
      id: 'office',
      name: 'Văn phòng',
      description: 'Đến trực tiếp văn phòng của chúng tôi',
      icon: MapPin,
      color: 'from-orange-500 to-orange-600',
      contact: 'Tầng 15, Tòa nhà EV Tower, Hà Nội',
      available: true,
      hours: '8:00 - 17:30',
      responseTime: 'Ngay lập tức'
    }
  ];

  const departments = [
    {
      id: 'general',
      name: 'Hỗ trợ chung',
      description: 'Câu hỏi chung về dịch vụ và sản phẩm',
      icon: Headphones,
      color: 'from-blue-500 to-blue-600',
      email: 'support@evmarket.vn',
      phone: '+84 1900 1234'
    },
    {
      id: 'technical',
      name: 'Hỗ trợ kỹ thuật',
      description: 'Vấn đề kỹ thuật và lỗi hệ thống',
      icon: Settings,
      color: 'from-green-500 to-green-600',
      email: 'tech@evmarket.vn',
      phone: '+84 1900 1235'
    },
    {
      id: 'sales',
      name: 'Bán hàng',
      description: 'Tư vấn mua sắm và đăng bán sản phẩm',
      icon: Car,
      color: 'from-purple-500 to-purple-600',
      email: 'sales@evmarket.vn',
      phone: '+84 1900 1236'
    },
    {
      id: 'billing',
      name: 'Thanh toán',
      description: 'Vấn đề về thanh toán và hóa đơn',
      icon: CreditCard,
      color: 'from-yellow-500 to-yellow-600',
      email: 'billing@evmarket.vn',
      phone: '+84 1900 1237'
    },
    {
      id: 'shipping',
      name: 'Vận chuyển',
      description: 'Hỗ trợ về giao hàng và vận chuyển',
      icon: Truck,
      color: 'from-indigo-500 to-indigo-600',
      email: 'shipping@evmarket.vn',
      phone: '+84 1900 1238'
    },
    {
      id: 'returns',
      name: 'Đổi trả',
      description: 'Xử lý đổi trả và hoàn tiền',
      icon: RotateCcw,
      color: 'from-red-500 to-red-600',
      email: 'returns@evmarket.vn',
      phone: '+84 1900 1239'
    }
  ];

  const faqItems = [
    {
      question: 'Thời gian phản hồi trung bình là bao lâu?',
      answer: 'Chúng tôi cam kết phản hồi trong vòng 24 giờ cho email và ngay lập tức cho điện thoại và chat trực tuyến.'
    },
    {
      question: 'Tôi có thể liên hệ ngoài giờ hành chính không?',
      answer: 'Có, dịch vụ chat trực tuyến và điện thoại hoạt động 24/7. Email sẽ được phản hồi trong giờ hành chính.'
    },
    {
      question: 'Có phí dịch vụ hỗ trợ không?',
      answer: 'Không, tất cả dịch vụ hỗ trợ của chúng tôi đều miễn phí cho khách hàng.'
    },
    {
      question: 'Tôi có thể yêu cầu hỗ trợ bằng tiếng Anh không?',
      answer: 'Có, chúng tôi hỗ trợ cả tiếng Việt và tiếng Anh. Vui lòng chỉ rõ ngôn ngữ bạn muốn sử dụng.'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: '',
        priority: 'normal'
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Liên hệ với chúng tôi</h1>
            <p className="text-xl text-blue-100">
              Chúng tôi luôn sẵn sàng hỗ trợ và giải đáp mọi thắc mắc của bạn
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactMethods.map(method => {
            const IconComponent = method.icon;
            return (
              <div key={method.id} className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300">
                <div className={`bg-gradient-to-r ${method.color} p-4 rounded-xl mx-auto mb-4 w-fit`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{method.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{method.description}</p>
                <div className="space-y-2">
                  <p className="font-semibold text-blue-600">{method.contact}</p>
                  <p className="text-sm text-gray-500">Giờ hoạt động: {method.hours}</p>
                  <p className="text-sm text-gray-500">Phản hồi: {method.responseTime}</p>
                </div>
                <button className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  method.color === 'from-green-500 to-green-600' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  method.color === 'from-blue-500 to-blue-600' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                  method.color === 'from-purple-500 to-purple-600' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                  'bg-orange-600 hover:bg-orange-700 text-white'
                }`}>
                  {method.id === 'live-chat' ? 'Bắt đầu chat' : 'Liên hệ ngay'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gửi tin nhắn cho chúng tôi</h2>
            
            {isSubmitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tin nhắn đã được gửi!</h3>
                <p className="text-gray-600">Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mức độ ưu tiên
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Thấp</option>
                      <option value="normal">Bình thường</option>
                      <option value="high">Cao</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn danh mục</option>
                    <option value="general">Hỗ trợ chung</option>
                    <option value="technical">Hỗ trợ kỹ thuật</option>
                    <option value="sales">Bán hàng</option>
                    <option value="billing">Thanh toán</option>
                    <option value="shipping">Vận chuyển</option>
                    <option value="returns">Đổi trả</option>
                    <option value="complaint">Khiếu nại</option>
                    <option value="suggestion">Đề xuất</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tiêu đề tin nhắn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung tin nhắn *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Gửi tin nhắn</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Departments & Info */}
          <div className="space-y-8">
            {/* Departments */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Các phòng ban</h2>
              <div className="space-y-4">
                {departments.map(dept => {
                  const IconComponent = dept.icon;
                  return (
                    <div key={dept.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className={`bg-gradient-to-r ${dept.color} p-3 rounded-xl flex-shrink-0`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{dept.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{dept.description}</p>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-700">{dept.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="text-gray-700">{dept.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Câu hỏi thường gặp</h2>
              <div className="space-y-4">
                {faqItems.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Office Info */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">Văn phòng chính</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Địa chỉ</p>
                    <p className="text-blue-100">Tầng 15, Tòa nhà EV Tower, 123 Đường ABC, Quận XYZ, Hà Nội</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Giờ làm việc</p>
                    <p className="text-blue-100">Thứ 2 - Thứ 6: 8:00 - 17:30</p>
                    <p className="text-blue-100">Thứ 7: 8:00 - 12:00</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Điện thoại</p>
                    <p className="text-blue-100">+84 24 1234 5678</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
