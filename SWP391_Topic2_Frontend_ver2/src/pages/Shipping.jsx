import { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  Package, 
  Shield, 
  Zap, 
  Car, 
  Battery, 
  Settings, 
  ArrowRight, 
  Star, 
  Users, 
  Award, 
  Calendar, 
  Phone, 
  Mail, 
  MessageCircle,
  Info,
  AlertCircle,
  TrendingUp,
  Globe,
  CreditCard,
  RotateCcw
} from 'lucide-react';

export const Shipping = () => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [weight, setWeight] = useState('');
  const [distance, setDistance] = useState('');

  const shippingMethods = [
    {
      id: 'standard',
      name: 'Vận chuyển tiêu chuẩn',
      description: 'Giao hàng trong 3-5 ngày làm việc',
      icon: Truck,
      color: 'from-blue-500 to-blue-600',
      price: '15,000 VNĐ/kg',
      features: ['Theo dõi đơn hàng', 'Bảo hiểm cơ bản', 'Giao hàng tận nơi'],
      deliveryTime: '3-5 ngày',
      coverage: 'Toàn quốc',
      maxWeight: '50kg',
      tracking: true,
      insurance: 'Cơ bản'
    },
    {
      id: 'express',
      name: 'Vận chuyển nhanh',
      description: 'Giao hàng trong 1-2 ngày làm việc',
      icon: Zap,
      color: 'from-green-500 to-green-600',
      price: '25,000 VNĐ/kg',
      features: ['Theo dõi real-time', 'Bảo hiểm đầy đủ', 'Ưu tiên cao'],
      deliveryTime: '1-2 ngày',
      coverage: 'Toàn quốc',
      maxWeight: '30kg',
      tracking: true,
      insurance: 'Đầy đủ'
    },
    {
      id: 'same-day',
      name: 'Giao hàng trong ngày',
      description: 'Giao hàng trong cùng ngày (nội thành)',
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      price: '50,000 VNĐ/kg',
      features: ['Giao hàng nhanh', 'Bảo hiểm cao', 'Dịch vụ VIP'],
      deliveryTime: 'Trong ngày',
      coverage: 'Nội thành',
      maxWeight: '20kg',
      tracking: true,
      insurance: 'Cao cấp'
    },
    {
      id: 'pickup',
      name: 'Tự vận chuyển',
      description: 'Người mua đến lấy hàng trực tiếp',
      icon: Car,
      color: 'from-orange-500 to-orange-600',
      price: 'Miễn phí',
      features: ['Không phí vận chuyển', 'Giao dịch trực tiếp', 'Kiểm tra hàng'],
      deliveryTime: 'Theo thỏa thuận',
      coverage: 'Tại địa điểm',
      maxWeight: 'Không giới hạn',
      tracking: false,
      insurance: 'Không'
    }
  ];

  const regions = [
    {
      id: 'hanoi',
      name: 'Hà Nội',
      provinces: ['Hà Nội', 'Hưng Yên', 'Hải Dương', 'Hải Phòng'],
      deliveryTime: '1-2 ngày',
      basePrice: 15000
    },
    {
      id: 'hcm',
      name: 'TP. Hồ Chí Minh',
      provinces: ['TP.HCM', 'Bình Dương', 'Đồng Nai', 'Long An'],
      deliveryTime: '1-2 ngày',
      basePrice: 15000
    },
    {
      id: 'central',
      name: 'Miền Trung',
      provinces: ['Đà Nẵng', 'Huế', 'Nha Trang', 'Quy Nhon'],
      deliveryTime: '2-3 ngày',
      basePrice: 20000
    },
    {
      id: 'south',
      name: 'Miền Nam',
      provinces: ['Cần Thơ', 'An Giang', 'Kiên Giang', 'Cà Mau'],
      deliveryTime: '3-4 ngày',
      basePrice: 25000
    },
    {
      id: 'north',
      name: 'Miền Bắc',
      provinces: ['Lào Cai', 'Điện Biên', 'Hà Giang', 'Cao Bằng'],
      deliveryTime: '4-5 ngày',
      basePrice: 30000
    }
  ];

  const trackingSteps = [
    {
      step: 1,
      title: 'Đơn hàng được tạo',
      description: 'Người bán xác nhận đơn hàng và chuẩn bị hàng',
      icon: Package,
      color: 'from-blue-500 to-blue-600'
    },
    {
      step: 2,
      title: 'Hàng được đóng gói',
      description: 'Sản phẩm được đóng gói cẩn thận và dán nhãn',
      icon: Shield,
      color: 'from-green-500 to-green-600'
    },
    {
      step: 3,
      title: 'Bàn giao cho đơn vị vận chuyển',
      description: 'Hàng được bàn giao cho đơn vị vận chuyển',
      icon: Truck,
      color: 'from-purple-500 to-purple-600'
    },
    {
      step: 4,
      title: 'Đang vận chuyển',
      description: 'Hàng đang trên đường đến địa chỉ người nhận',
      icon: ArrowRight,
      color: 'from-orange-500 to-orange-600'
    },
    {
      step: 5,
      title: 'Giao hàng thành công',
      description: 'Hàng đã được giao đến người nhận',
      icon: CheckCircle,
      color: 'from-green-500 to-green-600'
    }
  ];

  const faqItems = [
    {
      question: 'Làm thế nào để tính phí vận chuyển?',
      answer: 'Phí vận chuyển được tính dựa trên trọng lượng, khoảng cách và phương thức vận chuyển. Bạn có thể sử dụng công cụ tính phí trên trang này.'
    },
    {
      question: 'Tôi có thể theo dõi đơn hàng như thế nào?',
      answer: 'Bạn sẽ nhận được mã theo dõi qua SMS và email. Sử dụng mã này để theo dõi trạng thái đơn hàng trên website hoặc app.'
    },
    {
      question: 'Thời gian giao hàng có thể thay đổi không?',
      answer: 'Thời gian giao hàng có thể bị ảnh hưởng bởi thời tiết, lễ tết hoặc các sự kiện đặc biệt. Chúng tôi sẽ thông báo sớm nhất có thể.'
    },
    {
      question: 'Tôi có thể thay đổi địa chỉ giao hàng không?',
      answer: 'Có thể thay đổi địa chỉ giao hàng trước khi hàng được bàn giao cho đơn vị vận chuyển. Liên hệ hotline để được hỗ trợ.'
    }
  ];

  const calculateShippingCost = () => {
    if (!selectedRegion || !weight) return 0;
    
    const region = regions.find(r => r.id === selectedRegion);
    if (!region) return 0;
    
    const basePrice = region.basePrice;
    const weightNum = parseFloat(weight) || 0;
    
    return Math.round(basePrice * weightNum);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Thông tin vận chuyển</h1>
            <p className="text-xl text-blue-100">
              Dịch vụ vận chuyển nhanh chóng, an toàn và tiết kiệm
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shipping Methods */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Phương thức vận chuyển</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shippingMethods.map(method => {
              const IconComponent = method.icon;
              return (
                <div key={method.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`bg-gradient-to-r ${method.color} p-6 text-white`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{method.name}</h3>
                        <p className="text-white/80 text-sm">{method.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">{method.price}</div>
                        <div className="text-sm text-gray-500">Phí vận chuyển</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Thời gian:</span>
                          <span className="font-medium">{method.deliveryTime}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Phạm vi:</span>
                          <span className="font-medium">{method.coverage}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Trọng lượng tối đa:</span>
                          <span className="font-medium">{method.maxWeight}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Theo dõi:</span>
                          <span className="font-medium">{method.tracking ? 'Có' : 'Không'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bảo hiểm:</span>
                          <span className="font-medium">{method.insurance}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 text-sm">Tính năng:</h4>
                        {method.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping Calculator */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tính phí vận chuyển</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Khu vực</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn khu vực</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trọng lượng (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Nhập trọng lượng"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ước tính phí</label>
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {calculateShippingCost() > 0 ? `${calculateShippingCost().toLocaleString()} VNĐ` : 'Chưa tính'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Process */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quy trình theo dõi đơn hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {trackingSteps.map(step => {
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
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regions Coverage */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Phạm vi phục vụ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map(region => (
              <div key={region.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{region.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Thời gian:</span>
                    <span className="font-medium">{region.deliveryTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí cơ bản:</span>
                    <span className="font-medium">{region.basePrice.toLocaleString()} VNĐ/kg</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Tỉnh/thành phố:</h4>
                  <div className="flex flex-wrap gap-1">
                    {region.provinces.map(province => (
                      <span key={province} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {province}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Cần hỗ trợ về vận chuyển?</h2>
            <p className="text-blue-100 mb-6">
              Liên hệ với chúng tôi để được tư vấn và hỗ trợ tốt nhất
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2">
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
