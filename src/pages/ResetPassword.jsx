import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../lib/api';
import '../styles/resetpassword.css';

export const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = params.get('token') || '';
  
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  const validateForm = () => {
    if (!token.trim()) {
      setError('Token không được để trống');
      return false;
    }
    if (!password.trim()) {
      setError('Mật khẩu không được để trống');
      return false;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await apiRequest('/api/User/reset-password', {
        method: 'POST',
        body: { 
          token: token.trim(),
          newPassword: password,
          confirmPassword: confirmPassword
        },
      });
      
      setSuccess(true);
      setMessage('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="resetpassword-container">
        <div className="resetpassword-card resetpassword-success">
          <div className="resetpassword-success-icon">
            <CheckCircle size={64} />
          </div>
          <h1 className="resetpassword-title">Thành công!</h1>
          <p className="resetpassword-message">{message}</p>
          <p className="resetpassword-redirect">
            Đang chuyển hướng đến trang đăng nhập...
          </p>
          <Link to="/login" className="resetpassword-button">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="resetpassword-container">
      <div className="resetpassword-card">
        <div className="resetpassword-header">
          <Link to="/login" className="resetpassword-back">
            <ArrowLeft size={20} />
            Quay lại đăng nhập
          </Link>
          <h1 className="resetpassword-title">Đặt lại mật khẩu</h1>
          <p className="resetpassword-description">
            Nhập mật khẩu mới của bạn.
          </p>
        </div>

        {error && (
          <div className="resetpassword-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="resetpassword-form">
          <div className="resetpassword-field">
            <label htmlFor="token" className="resetpassword-label">
              Token
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="resetpassword-input"
              placeholder="Token từ email hoặc URL"
              required
            />
            <small className="resetpassword-hint">
              Token sẽ được tự động điền nếu bạn truy cập từ liên kết email
            </small>
          </div>

          <div className="resetpassword-field">
            <label htmlFor="password" className="resetpassword-label">
              Mật khẩu mới
            </label>
            <div className="resetpassword-input-container">
              <Lock className="resetpassword-input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="resetpassword-input"
                placeholder="Nhập mật khẩu mới"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="resetpassword-password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="resetpassword-field">
            <label htmlFor="confirmPassword" className="resetpassword-label">
              Xác nhận mật khẩu
            </label>
            <div className="resetpassword-input-container">
              <Lock className="resetpassword-input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="resetpassword-input"
                placeholder="Nhập lại mật khẩu mới"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="resetpassword-password-toggle"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="resetpassword-button"
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="resetpassword-footer">
          <p>
            Nhớ lại mật khẩu?{' '}
            <Link to="/login" className="resetpassword-link">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};