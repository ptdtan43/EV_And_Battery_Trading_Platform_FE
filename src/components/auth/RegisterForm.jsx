import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  Eye,
  EyeOff,
  Car,
  Zap,
  Shield,
  Star,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import "../../styles/auth.css";

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, signOut } = useAuth();
  const { show: showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;
    setLoading(true);

    try {
      console.log("🚀 Starting registration process...");
      const session = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone
      );

      console.log("✅ Registration successful!");

      // If registration succeeded with token, user is already logged in
      if (session?.token && session?.user) {
        console.log("✅ User is logged in after registration, redirecting to home...");
        
        // Show success message and redirect to home
        setError("");
        showToast({
          title: "🎉 Đăng ký thành công!",
          description: "Chào mừng bạn đến với EV Market!",
          type: "success",
        });

        // Redirect to home page after a short delay
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        // If no token, redirect to login page
        console.log("⚠️ No token after registration, redirecting to login...");
        
        // Sign out any existing session
        signOut();

        // Show success message and redirect to login
        setError("");
        showToast({
          title: "🎉 Đăng ký thành công!",
          description:
            "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để tiếp tục.",
          type: "success",
        });

        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      console.error("Register form error:", err);

      // Handle specific error cases
      let errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";

      if (err.status === 400) {
        if (err.data && typeof err.data === "object") {
          // Try to extract meaningful error message
          errorMessage =
            err.data.message ||
            err.data.error ||
            "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
        } else if (err.message && err.message.includes("400")) {
          errorMessage =
            "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
        } else {
          errorMessage =
            "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
        }
      } else if (err.status === 409) {
        errorMessage = "Email này đã được sử dụng. Vui lòng chọn email khác.";
      } else if (err.status === 500) {
        if (err.message && err.message.includes("SQL Server")) {
          errorMessage = "Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau.";
        } else {
          errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
        }
      } else if (err.message) {
        // Handle specific error messages
        if (err.message.includes("All data formats rejected")) {
          errorMessage =
            "Định dạng dữ liệu không được hỗ trợ. Vui lòng liên hệ quản trị viên.";
        } else if (
          err.message.includes("Registration completed but auto-login failed")
        ) {
          errorMessage =
            "Đăng ký thành công nhưng không thể đăng nhập tự động. Vui lòng đăng nhập thủ công.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden auth-bg">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Electric car silhouettes - more variety */}
        <div className="absolute top-16 right-16 w-40 h-20 opacity-15 car-silhouette-1">
          <svg viewBox="0 0 200 100" className="w-full h-full text-cyan-400">
            <path
              d="M15 65 L40 45 L170 45 L190 65 L190 85 L170 85 L150 65 L110 65 L90 85 L70 85 L50 65 L15 65 Z"
              fill="currentColor"
              opacity="0.3"
            />
            <circle cx="30" cy="85" r="8" fill="currentColor" opacity="0.4" />
            <circle cx="170" cy="85" r="8" fill="currentColor" opacity="0.4" />
            <rect
              x="80"
              y="50"
              width="40"
              height="15"
              fill="currentColor"
              opacity="0.2"
            />
            <rect
              x="85"
              y="35"
              width="30"
              height="10"
              fill="currentColor"
              opacity="0.1"
            />
          </svg>
        </div>

        <div className="absolute top-32 left-12 w-36 h-18 opacity-20 car-silhouette-2">
          <svg viewBox="0 0 200 100" className="w-full h-full text-emerald-400">
            <path
              d="M25 62 L50 42 L180 42 L200 62 L200 82 L180 82 L160 62 L120 62 L100 82 L80 82 L60 62 L25 62 Z"
              fill="currentColor"
              opacity="0.3"
            />
            <circle cx="40" cy="82" r="8" fill="currentColor" opacity="0.4" />
            <circle cx="160" cy="82" r="8" fill="currentColor" opacity="0.4" />
            <rect
              x="90"
              y="47"
              width="20"
              height="15"
              fill="currentColor"
              opacity="0.2"
            />
            <rect
              x="95"
              y="32"
              width="10"
              height="10"
              fill="currentColor"
              opacity="0.1"
            />
          </svg>
        </div>

        <div className="absolute bottom-40 left-20 w-44 h-22 opacity-10 car-silhouette-3">
          <svg viewBox="0 0 200 100" className="w-full h-full text-blue-400">
            <path
              d="M20 60 L55 40 L185 40 L205 60 L205 80 L185 80 L165 60 L125 60 L105 80 L85 80 L65 60 L20 60 Z"
              fill="currentColor"
              opacity="0.3"
            />
            <circle cx="45" cy="80" r="8" fill="currentColor" opacity="0.4" />
            <circle cx="165" cy="80" r="8" fill="currentColor" opacity="0.4" />
            <rect
              x="95"
              y="45"
              width="10"
              height="15"
              fill="currentColor"
              opacity="0.2"
            />
            <rect
              x="100"
              y="30"
              width="20"
              height="10"
              fill="currentColor"
              opacity="0.1"
            />
          </svg>
        </div>

        {/* Tech elements */}
        <div className="absolute top-1/4 left-1/4 w-6 h-6 border-2 border-cyan-400 border-dashed opacity-30 tech-element-1"></div>
        <div className="absolute bottom-1/3 right-1/4 w-4 h-4 border border-emerald-400 opacity-40 tech-element-2"></div>
        <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-blue-400 opacity-20 rounded-full tech-element-3"></div>
        <div className="absolute bottom-1/4 left-1/2 w-5 h-5 border border-indigo-400 opacity-25 tech-element-4"></div>

        {/* Circuit patterns */}
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 1000 1000" className="w-full h-full">
            <defs>
              <pattern
                id="circuit2"
                x="0"
                y="0"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 40 L80 40 M40 0 L40 80 M20 20 L60 60 M60 20 L20 60"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
                <circle cx="40" cy="40" r="3" fill="currentColor" />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#circuit2)"
              className="text-cyan-400"
            />
          </svg>
        </div>

        {/* Floating particles */}
        <div className="absolute top-24 right-1/4 w-2 h-2 bg-cyan-400 rounded-full opacity-60 particle-1"></div>
        <div className="absolute top-1/2 left-1/5 w-1 h-1 bg-emerald-400 rounded-full opacity-80 particle-2"></div>
        <div className="absolute bottom-1/4 right-1/5 w-3 h-3 bg-blue-400 rounded-full opacity-40 particle-3"></div>
        <div className="absolute bottom-24 left-1/4 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-70 particle-4"></div>
        <div className="absolute top-1/3 right-1/5 w-2 h-2 bg-purple-400 rounded-full opacity-50 particle-5"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 auth-form-container">
        <div className="auth-center-wrapper">
          {/* Glassmorphism Register Card */}
          <div className="auth-card p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="auth-header-icon">
                <Car />
              </div>
              <h2 className="auth-title">EV Market</h2>
              <p className="auth-subtitle">Tạo tài khoản mới</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <AlertCircle className="error-icon" />
                <span className="error-text">{error}</span>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Full Name Field */}
              <div className="auth-field">
                <label htmlFor="fullName" className="auth-label">
                  Họ và tên
                </label>
                <div className="auth-input-container">
                  <User className="auth-input-icon" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">
                  Email
                </label>
                <div className="auth-input-container">
                  <Mail className="auth-input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="auth-field">
                <label htmlFor="phone" className="auth-label">
                  Số điện thoại
                </label>
                <div className="auth-input-container">
                  <Phone className="auth-input-icon" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="0123456789"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="auth-field">
                <label htmlFor="password" className="auth-label">
                  Mật khẩu
                </label>
                <div className="auth-input-container">
                  <Lock className="auth-input-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-password-toggle"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="auth-field">
                <label htmlFor="confirmPassword" className="auth-label">
                  Xác nhận mật khẩu
                </label>
                <div className="auth-input-container">
                  <Lock className="auth-input-icon" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="auth-password-toggle"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  id="terms"
                  type="checkbox"
                  className="auth-checkbox"
                  required
                />
                <label htmlFor="terms" className="auth-checkbox-label">
                  Tôi đồng ý với{" "}
                  <Link
                    to="/terms"
                    className="text-emerald-300 hover:text-white transition-colors"
                  >
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link
                    to="/privacy"
                    className="text-emerald-300 hover:text-white transition-colors"
                  >
                    Chính sách bảo mật
                  </Link>
                </label>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 register-button"
              >
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>

            {/* Login Link */}
            <div className="auth-link-container">
              <p className="auth-link-text">
                Đã có tài khoản?{" "}
                <Link to="/login" className="auth-link">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Benefits Cards */}
          <div className="mt-8 flex justify-center">
            <div className="register-features">
              <div className="auth-feature-card">
                <Car className="auth-feature-icon text-emerald-400" />
                <p className="auth-feature-text">Hàng nghìn xe điện</p>
              </div>
              <div className="auth-feature-card">
                <Zap className="auth-feature-icon text-yellow-400" />
                <p className="auth-feature-text">Giá cạnh tranh</p>
              </div>
              <div className="auth-feature-card">
                <Shield className="auth-feature-icon text-blue-400" />
                <p className="auth-feature-text">Giao dịch an toàn</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
