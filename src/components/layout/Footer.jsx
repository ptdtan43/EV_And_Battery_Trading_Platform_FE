import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Zap, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Award,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Send,
  Globe,
  MessageCircle,
  Headphones,
  FileText,
  HelpCircle,
  Star,
  Heart,
  Truck,
  CreditCard,
  Lock
} from 'lucide-react';

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const location = useLocation();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  // Generic handler to scroll to top when clicking link to current page
  const handleLinkClick = (targetPath) => {
    if (location.pathname === targetPath) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-gray-300 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center space-x-3 mb-6 group" onClick={() => handleLinkClick("/")}>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">EV Market</span>
                  <p className="text-sm text-blue-300">Nền tảng xe điện hàng đầu</p>
                </div>
              </Link>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                Nền tảng giao dịch xe điện & pin số 1 Việt Nam. Mua bán xe điện an toàn, minh bạch với
                giá tốt nhất thị trường. Cam kết mang đến trải nghiệm mua sắm tuyệt vời.
              </p>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>Bảo mật cao</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Award className="h-4 w-4 text-yellow-400" />
                  <span>Chất lượng đảm bảo</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>50K+ người dùng</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <span>Tăng trưởng mạnh</span>
                </div>
              </div>

              {/* Social Media */}
              <div className="flex space-x-4">
                <a href="#" className="bg-gray-800 hover:bg-blue-600 p-3 rounded-full transition-all duration-300 hover:scale-110">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-blue-400 p-3 rounded-full transition-all duration-300 hover:scale-110">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-pink-600 p-3 rounded-full transition-all duration-300 hover:scale-110">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-red-600 p-3 rounded-full transition-all duration-300 hover:scale-110">
                  <Youtube className="h-5 w-5" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-blue-700 p-3 rounded-full transition-all duration-300 hover:scale-110">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-6 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-blue-400" />
                Khám phá
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/products" className="hover:text-blue-400 transition-colors flex items-center group" onClick={() => handleLinkClick("/products")}>
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Sản phẩm
                  </Link>
                </li>
                <li>
                  <Link to="/categories" className="hover:text-blue-400 transition-colors flex items-center group" onClick={() => handleLinkClick("/categories")}>
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Danh mục
                  </Link>
                </li>
                <li>
                  <Link to="/brands" className="hover:text-blue-400 transition-colors flex items-center group" onClick={() => handleLinkClick("/brands")}>
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Thương hiệu
                  </Link>
                </li>
                <li>
                  <Link to="/deals" className="hover:text-blue-400 transition-colors flex items-center group" onClick={() => handleLinkClick("/deals")}>
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Ưu đãi
                  </Link>
                </li>
                <li>
                  <Link to="/reviews" className="hover:text-blue-400 transition-colors flex items-center group" onClick={() => handleLinkClick("/reviews")}>
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Đánh giá
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-6 flex items-center">
                <Headphones className="h-5 w-5 mr-2 text-green-400" />
                Hỗ trợ
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/help" className="hover:text-blue-400 transition-colors flex items-center group" onClick={() => handleLinkClick("/help")}>
                    <HelpCircle className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Trung tâm trợ giúp
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-blue-400 transition-colors flex items-center group" onClick={() => handleLinkClick("/faq")}>
                    <MessageCircle className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-blue-400 transition-colors flex items-center group" onClick={() => handleLinkClick("/contact")}>
                    <Mail className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Liên hệ
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="hover:text-blue-400 transition-colors flex items-center group" onClick={() => handleLinkClick("/shipping")}>
                    <Truck className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Vận chuyển
                  </Link>
                </li>
                <li>
                  <Link to="/returns" className="hover:text-blue-400 transition-colors flex items-center group" onClick={() => handleLinkClick("/returns")}>
                    <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Đổi trả
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter & Contact */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-6 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-purple-400" />
                Liên hệ
              </h3>
              
              {/* Newsletter */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">Đăng ký nhận tin tức mới nhất</p>
                <form onSubmit={handleNewsletterSubmit} className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email của bạn"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-r-lg transition-all duration-300 hover:scale-105"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                {isSubscribed && (
                  <p className="text-green-400 text-sm mt-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Đăng ký thành công!
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <span>+84 123 456 789</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span>support@evmarket.vn</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span>Hà Nội, Việt Nam</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span>24/7 Hỗ trợ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <span className="text-sm text-gray-400">Phương thức thanh toán:</span>
              <div className="flex space-x-2">
                <div className="bg-gray-800 p-2 rounded">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <Lock className="h-5 w-5 text-green-400" />
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <Link to="/terms" className="hover:text-blue-400 transition-colors" onClick={() => handleLinkClick("/terms")}>
                Điều khoản sử dụng
              </Link>
              <Link to="/privacy" className="hover:text-blue-400 transition-colors" onClick={() => handleLinkClick("/privacy")}>
                Chính sách bảo mật
              </Link>
              <Link to="/cookies" className="hover:text-blue-400 transition-colors" onClick={() => handleLinkClick("/cookies")}>
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <p className="text-sm text-gray-400">
                &copy; 2024 EV Market. Tất cả quyền được bảo lưu.
              </p>
              <div className="flex items-center space-x-1 text-yellow-400">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm text-gray-400 ml-2">4.9/5 từ 10,000+ đánh giá</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-400">Được phát triển với</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span className="text-gray-400">tại Việt Nam</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
