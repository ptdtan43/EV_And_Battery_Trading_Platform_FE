import { useState } from 'react';
import { 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Package, 
  Truck, 
  CreditCard, 
  Shield, 
  FileText, 
  Phone, 
  Mail, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Star, 
  Users, 
  Award, 
  Zap, 
  Car, 
  Battery, 
  Settings, 
  ArrowRight,
  Send,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

export const Returns = () => {
  const [returnForm, setReturnForm] = useState({
    orderNumber: '',
    reason: '',
    description: '',
    condition: '',
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const returnReasons = [
    {
      id: 'defective',
      name: 'Sản phẩm bị lỗi',
      description: 'Sản phẩm không hoạt động hoặc có lỗi từ nhà sản xuất',
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      refundType: 'Hoàn tiền 100%',
      timeframe: '7 ngày'
    },
    {
      id: 'wrong-item',
      name: 'Sai sản phẩm',
      description: 'Nhận được sản phẩm khác với mô tả',
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      refundType: 'Hoàn tiền 100%',
      timeframe: '7 ngày'
    },
    {
      id: 'damaged',
      name: 'Hàng bị hỏng',
      description: 'Sản phẩm bị hỏng trong quá trình vận chuyển',
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      refundType: 'Hoàn tiền 100%',
      timeframe: '7 ngày'
    },
    {
      id: 'not-as-described',
      name: 'Không đúng mô tả',
      description: 'Sản phẩm không giống với mô tả ban đầu',
      icon: FileText,
      color: 'from-yellow-500 to-yellow-600',
      refundType: 'Hoàn tiền 100%',
      timeframe: '7 ngày'
    },
    {
      id: 'changed-mind',
      name: 'Thay đổi ý định',
      description: 'Không còn muốn mua sản phẩm này',
      icon: RotateCcw,
      color: 'from-blue-500 to-blue-600',
      refundType: 'Hoàn tiền 80%',
      timeframe: '3 ngày'
    },
    {
      id: 'size-issue',
      name: 'Vấn đề kích thước',
      description: 'Sản phẩm không phù hợp về kích thước',
      icon: Settings,
      color: 'from-purple-500 to-purple-600',
      refundType: 'Hoàn tiền 90%',
      timeframe: '5 ngày'
    }
  ];

  const returnProcess = [
    {
      step: 1,
      title: 'Tạo yêu cầu đổi trả',
      description: 'Điền form đổi trả và cung cấp thông tin chi tiết',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      duration: '5 phút'
    },
    {
      step: 2,
      title: 'Xem xét yêu cầu',
      description: 'Chúng tôi sẽ xem xét yêu cầu trong vòng 24h',
      icon: Eye,
      color: 'from-yellow-500 to-yellow-600',
      duration: '24 giờ'
    },
    {
      step: 3,
      title: 'Chuẩn bị hàng trả',
      description: 'Đóng gói sản phẩm và chuẩn bị gửi trả',
      icon: Package,
      color: 'from-green-500 to-green-600',
      duration: '1 ngày'
    },
    {
      step: 4,
      title: 'Vận chuyển trả hàng',
      description: 'Đơn vị vận chuyển đến lấy hàng',
      icon: Truck,
      color: 'from-purple-500 to-purple-600',
      duration: '1-2 ngày'
    },
    {
      step: 5,
      title: 'Kiểm tra và hoàn tiền',
      description: 'Kiểm tra hàng và thực hiện hoàn tiền',
      icon: CreditCard,
      color: 'from-green-500 to-green-600',
      duration: '3-5 ngày'
    }
  ];

  const returnPolicy = [
    {
      category: 'Điều kiện đổi trả',
      items: [
        'Sản phẩm còn nguyên vẹn, chưa sử dụng',
        'Còn đầy đủ phụ kiện và bao bì gốc',
        'Trong thời hạn quy định (3-7 ngày)',
        'Có hóa đơn mua hàng hợp lệ',
        'Không thuộc danh mục không được đổi trả'
      ]
    },
    {
      category: 'Sản phẩm không được đổi trả',
      items: [
        'Sản phẩm đã qua sử dụng',
        'Phụ kiện cá nhân (mũ bảo hiểm, găng tay)',
            'Sản phẩm đã được tùy chỉnh',
        'Hàng hóa có dấu hiệu hư hỏng do người dùng',
        'Sản phẩm đã hết thời hạn đổi trả'
      ]
    },
    {
      category: 'Phí đổi trả',
      items: [
        'Miễn phí nếu lỗi từ phía người bán',
        'Miễn phí nếu sản phẩm không đúng mô tả',
        'Người mua chịu phí nếu thay đổi ý định',
        'Phí vận chuyển: 30,000 VNĐ',
        'Phí xử lý: 50,000 VNĐ (nếu áp dụng)'
      ]
    }
  ];

  const faqItems = [
    {
      question: 'Tôi có thể đổi trả sản phẩm trong bao lâu?',
      answer: 'Thời gian đổi trả tùy thuộc vào lý do: 7 ngày cho sản phẩm lỗi, 3 ngày cho thay đổi ý định.'
    },
    {
      question: 'Phí đổi trả được tính như thế nào?',
      answer: 'Miễn phí nếu lỗi từ người bán, người mua chịu phí nếu thay đổi ý định.'
    },
    {
      question: 'Tôi có thể đổi lấy sản phẩm khác không?',
      answer: 'Có, bạn có thể đổi lấy sản phẩm khác cùng giá trị hoặc bù thêm tiền.'
    },
    {
      question: 'Thời gian hoàn tiền là bao lâu?',
      answer: 'Thông thường 3-5 ngày làm việc sau khi nhận được hàng trả.'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReturnForm(prev => ({
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
      setReturnForm({
        orderNumber: '',
        reason: '',
        description: '',
        condition: '',
        images: []
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Chính sách đổi trả</h1>
            <p className="text-xl text-orange-100">
              Đổi trả dễ dàng, hoàn tiền nhanh chóng và minh bạch
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Return Reasons */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Lý do đổi trả</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {returnReasons.map(reason => {
              const IconComponent = reason.icon;
              return (
                <div key={reason.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`bg-gradient-to-r ${reason.color} p-6 text-white`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{reason.name}</h3>
                        <p className="text-white/80 text-sm">{reason.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600 mb-1">{reason.refundType}</div>
                        <div className="text-sm text-gray-500">Mức hoàn tiền</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600 mb-1">{reason.timeframe}</div>
                        <div className="text-sm text-gray-500">Thời hạn</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Return Process */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quy trình đổi trả</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {returnProcess.map(step => {
              const IconComponent = step.icon;
              return (
                <div key={step.step} className="text-center">
                  <div className={`bg-gradient-to-r ${step.color} p-4 rounded-xl mx-auto mb-4 w-fit`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-3 mx-auto w-fit">
                    Bước {step.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {step.duration}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Return Policy */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {returnPolicy.map((policy, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{policy.category}</h3>
              <div className="space-y-3">
                {policy.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Return Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo yêu cầu đổi trả</h2>
          
          {isSubmitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Yêu cầu đổi trả đã được gửi!</h3>
              <p className="text-gray-600">Chúng tôi sẽ xem xét và phản hồi trong vòng 24 giờ.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã đơn hàng *
                  </label>
                  <input
                    type="text"
                    name="orderNumber"
                    value={returnForm.orderNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mã đơn hàng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do đổi trả *
                  </label>
                  <select
                    name="reason"
                    value={returnForm.reason}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn lý do</option>
                    {returnReasons.map(reason => (
                      <option key={reason.id} value={reason.id}>{reason.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết *
                </label>
                <textarea
                  name="description"
                  value={returnForm.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mô tả chi tiết về vấn đề hoặc lý do đổi trả..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tình trạng sản phẩm *
                </label>
                <select
                  name="condition"
                  value={returnForm.condition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn tình trạng</option>
                  <option value="new">Mới, chưa sử dụng</option>
                  <option value="like-new">Như mới, sử dụng ít</option>
                  <option value="good">Tốt, có dấu hiệu sử dụng</option>
                  <option value="damaged">Bị hỏng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh sản phẩm (tùy chọn)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Kéo thả hình ảnh hoặc click để chọn</p>
                  <p className="text-sm text-gray-500">Tối đa 5 hình, mỗi hình dưới 5MB</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Gửi yêu cầu đổi trả</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Câu hỏi thường gặp</h2>
          <div className="space-y-6">
            {faqItems.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Cần hỗ trợ về đổi trả?</h2>
            <p className="text-red-100 mb-6">
              Liên hệ với chúng tôi để được hỗ trợ tốt nhất
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-red-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Gọi hotline</span>
              </button>
              <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Chat trực tuyến</span>
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
