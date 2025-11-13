import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle, Eye, EyeOff, Car, Zap, Shield, Star } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../lib/api";
import "../../styles/auth.css";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const getErrorMessage = (err) => {
    if (!err) return "Đã xảy ra lỗi không xác định.";
    // Network error (no response)
    if (err.status === 0 || err.message === "Failed to fetch") {
      return "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng hoặc API.";
    }
    // Backend provided message
    const backendMsg = err?.data?.message || err?.message;
    if (err.status === 401) {
      return backendMsg || "Email hoặc mật khẩu không đúng.";
    }
    if (err.status === 400) {
      return backendMsg || "Thông tin đăng nhập không hợp lệ.";
    }
    if (err.status >= 500) {
      return backendMsg || "Máy chủ gặp sự cố. Vui lòng thử lại sau.";
    }
    return backendMsg || "Đăng nhập thất bại. Vui lòng thử lại.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await signIn(email, password);

      // Debug logging
      console.log("=== LOGIN DEBUG ===");
      console.log("Full session data:", session);
      console.log("User object:", session?.user);
      console.log("Profile object:", session?.profile);

      const rawId =
        session?.user?.roleId ??
        session?.profile?.roleId ??
        session?.user?.role;
      const rid = typeof rawId === "string" ? Number(rawId) : rawId;
      const roleName = (session?.user?.roleName || session?.profile?.role || "")
        .toString()
        .toLowerCase();
      const isAdmin = rid === 1 || roleName === "admin";

      console.log("Raw roleId:", rawId);
      console.log("Processed roleId:", rid);
      console.log("Role name:", roleName);
      console.log("Is admin:", isAdmin);
      console.log("Will navigate to:", "/");
      console.log("==================");

      // Add a small delay to ensure state is updated before navigation
      setTimeout(() => {
        setLoading(false);
        navigate("/");
      }, 200);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden auth-bg">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Electric car silhouettes */}
        <div className="absolute top-20 left-10 w-32 h-16 opacity-20 car-silhouette-1">
          <svg viewBox="0 0 200 100" className="w-full h-full text-blue-400">
            <path d="M20 60 L50 40 L180 40 L200 60 L200 80 L180 80 L160 60 L120 60 L100 80 L80 80 L60 60 L20 60 Z" fill="currentColor" opacity="0.3"/>
            <circle cx="40" cy="80" r="8" fill="currentColor" opacity="0.4"/>
            <circle cx="160" cy="80" r="8" fill="currentColor" opacity="0.4"/>
            <rect x="80" y="45" width="40" height="15" fill="currentColor" opacity="0.2"/>
          </svg>
        </div>
        
        <div className="absolute top-40 right-20 w-40 h-20 opacity-15 car-silhouette-2">
          <svg viewBox="0 0 200 100" className="w-full h-full text-cyan-400">
            <path d="M20 65 L45 45 L175 45 L195 65 L195 85 L175 85 L155 65 L115 65 L95 85 L75 85 L55 65 L20 65 Z" fill="currentColor" opacity="0.3"/>
            <circle cx="35" cy="85" r="8" fill="currentColor" opacity="0.4"/>
            <circle cx="165" cy="85" r="8" fill="currentColor" opacity="0.4"/>
            <rect x="85" y="50" width="30" height="15" fill="currentColor" opacity="0.2"/>
          </svg>
        </div>

        <div className="absolute bottom-32 left-20 w-36 h-18 opacity-10 car-silhouette-3">
          <svg viewBox="0 0 200 100" className="w-full h-full text-emerald-400">
            <path d="M25 62 L55 42 L185 42 L205 62 L205 82 L185 82 L165 62 L125 62 L105 82 L85 82 L65 62 L25 62 Z" fill="currentColor" opacity="0.3"/>
            <circle cx="45" cy="82" r="8" fill="currentColor" opacity="0.4"/>
            <circle cx="165" cy="82" r="8" fill="currentColor" opacity="0.4"/>
            <rect x="90" y="47" width="20" height="15" fill="currentColor" opacity="0.2"/>
          </svg>
        </div>

        {/* Tech elements */}
        <div className="absolute top-1/4 right-1/4 w-8 h-8 border-2 border-blue-400 border-dashed opacity-30 tech-element-1"></div>
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 border border-cyan-400 opacity-40 tech-element-2"></div>
        <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-emerald-400 opacity-20 rounded-full tech-element-3"></div>
        
        {/* Circuit patterns */}
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 1000 1000" className="w-full h-full">
            <defs>
              <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M0 50 L100 50 M50 0 L50 100 M25 25 L75 75 M75 25 L25 75" stroke="currentColor" strokeWidth="1" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" className="text-blue-400"/>
          </svg>
        </div>

        {/* Floating particles */}
        <div className="absolute top-20 right-1/3 w-2 h-2 bg-blue-400 rounded-full opacity-60 particle-1"></div>
        <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-cyan-400 rounded-full opacity-80 particle-2"></div>
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-emerald-400 rounded-full opacity-40 particle-3"></div>
        <div className="absolute bottom-20 left-1/3 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-70 particle-4"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 auth-form-container">
        <div className="auth-center-wrapper">
          {/* Glassmorphism Login Card */}
          <div className="auth-card p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="auth-header-icon">
                <Car />
              </div>
              <h2 className="auth-title">EV Market</h2>
              <p className="auth-subtitle">Chào mừng bạn trở lại!</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <AlertCircle className="error-icon" />
                <span className="error-text">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email Field */}
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">
                  Email
                </label>
                <div className="auth-input-container">
                  <Mail className="auth-input-icon" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    placeholder="username@gmail.com"
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-password-toggle"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="auth-options">
                <div className="auth-checkbox-container">
                  <input
                    id="remember"
                    type="checkbox"
                    className="auth-checkbox"
                  />
                  <label htmlFor="remember" className="auth-checkbox-label">
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="auth-forgot-link"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 auth-button"
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line">
                <div className="auth-divider-text">
                  <span>hoặc tiếp tục với</span>
                </div>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="auth-social-buttons">
              <button
                onClick={() => window.location.href = `${API_BASE_URL}/api/Auth/google`}
                className="auth-social-button"
              >
                <svg className="auth-social-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="auth-social-text">Google</span>
              </button>
              
              <button
                onClick={() => window.location.href = `${API_BASE_URL}/api/Auth/facebook`}
                className="auth-social-button"
              >
                <svg className="auth-social-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="auth-social-text">Facebook</span>
              </button>
            </div>

            {/* Register Link */}
            <div className="auth-link-container">
              <p className="auth-link-text">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="auth-link"
                >
                  Đăng ký miễn phí
                </Link>
              </p>
            </div>
          </div>

          {/* Features Cards */}
          <div className="mt-8 flex justify-center">
            <div className="grid grid-cols-3 gap-4 max-w-xs">
              <div className="feature-card">
                <Car className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-blue-200">Xe điện chất lượng</p>
              </div>
              <div className="feature-card">
                <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-xs text-blue-200">Giao dịch nhanh</p>
              </div>
              <div className="feature-card">
                <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-xs text-blue-200">Bảo mật tuyệt đối</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};