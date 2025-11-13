import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '../lib/api';
import '../styles/forgotpassword.css';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const response = await apiRequest('/api/User/forgot-password', {
        method: 'POST',
        body: { email },
      });
      
      setSuccess(true);
      setMessage('Vui lòng kiểm tra email để nhận liên kết đặt lại mật khẩu.');
      
      // Development mode: Log token to console
      if (process.env.NODE_ENV === 'development') {
        console.log('=== FORGOT PASSWORD DEBUG ===');
        console.log('Email:', email);
        console.log('Response:', response);
        console.log('Check backend console for reset token');
        console.log('=============================');
      }
    } catch (err) {
      setError(err.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setSuccess(false);
    setMessage('');
    setError('');
    setEmail('');
  };

  if (success) {
    return (
      <div className="forgotpassword-container">
        <div className="forgotpassword-card forgotpassword-success">
          <div className="forgotpassword-success-icon">
            <CheckCircle size={64} />
          </div>
          <h1 className="forgotpassword-title">Email đã được gửi!</h1>
          <p className="forgotpassword-message">{message}</p>
          <div className="forgotpassword-note">
            <p><strong>Lưu ý:</strong></p>
            <p>• Kiểm tra hộp thư đến và thư mục spam</p>
            <p>• Liên kết sẽ hết hạn sau 24 giờ</p>
            <p>• Nếu không nhận được email, hãy thử lại</p>
          </div>
          <div className="forgotpassword-actions">
            <button 
              type="button" 
              onClick={handleResend}
              className="forgotpassword-button secondary"
            >
              Gửi lại liên kết
            </button>
            <Link to="/login" className="forgotpassword-button">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgotpassword-container">
      <div className="forgotpassword-card">
        <div className="forgotpassword-header">
          <Link to="/login" className="forgotpassword-back">
            <ArrowLeft size={20} />
            Quay lại
          </Link>
          <h1 className="forgotpassword-title">Quên mật khẩu</h1>
          <p className="forgotpassword-description">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
          </p>
        </div>

        {error && (
          <div className="forgotpassword-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="forgotpassword-form">
          <div className="forgotpassword-field">
            <label htmlFor="email" className="forgotpassword-label">
              Email
            </label>
            <div className="forgotpassword-input-container">
              <Mail className="forgotpassword-input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="forgotpassword-input"
                placeholder="Nhập email của bạn"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="forgotpassword-button"
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
          </button>
        </form>

        <div className="forgotpassword-footer">
          <p>
            Nhớ lại mật khẩu?{' '}
            <Link to="/login" className="forgotpassword-link">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};