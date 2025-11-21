import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Lock, Key } from 'lucide-react';
import { apiRequest } from '../lib/api';
import '../styles/forgotpassword.css';

export const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const response = await apiRequest('/api/User/forgot-password', {
        method: 'POST',
        body: { email },
      });
      
      // Development mode: Log OTP to console
      if (process.env.NODE_ENV === 'development' && response.resetToken) {
        console.log('=== FORGOT PASSWORD DEBUG ===');
        console.log('Email:', email);
        console.log('OTP:', response.resetToken);
        console.log('=============================');
      }
      
      setStep(2);
      setMessage('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      setError(err.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    // Validate
    if (otp.length !== 6) {
      setError('Mã OTP phải có 6 chữ số');
      setLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }
    
    try {
      await apiRequest('/api/User/reset-password', {
        method: 'POST',
        body: {
          token: otp,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        },
      });
      
      setSuccess(true);
      setMessage('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.');
    } catch (err) {
      setError(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setSuccess(false);
    setStep(1);
    setMessage('');
    setError('');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleBackToEmail = () => {
    setStep(1);
    setMessage('');
    setError('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (success) {
    return (
      <div className="forgotpassword-container">
        <div className="forgotpassword-card forgotpassword-success">
          <div className="forgotpassword-success-icon">
            <CheckCircle size={64} />
          </div>
          <h1 className="forgotpassword-title">Đặt lại mật khẩu thành công!</h1>
          <p className="forgotpassword-message">
            Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập với mật khẩu mới.
          </p>
          <div className="forgotpassword-note">
            <p><strong>Lưu ý:</strong></p>
            <p>• Sử dụng mật khẩu mới để đăng nhập</p>
            <p>• Không chia sẻ mật khẩu với bất kỳ ai</p>
            <p>• Nếu bạn không thực hiện thao tác này, vui lòng liên hệ admin ngay</p>
          </div>
          <div className="forgotpassword-actions">
            <Link to="/login" className="forgotpassword-button">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Enter Email
  if (step === 1) {
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
              Nhập email của bạn để nhận mã OTP đặt lại mật khẩu.
            </p>
          </div>

          {error && (
            <div className="forgotpassword-error">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitEmail} className="forgotpassword-form">
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
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
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
  }

  // Step 2: Enter OTP and New Password
  return (
    <div className="forgotpassword-container">
      <div className="forgotpassword-card">
        <div className="forgotpassword-header">
          <button onClick={handleBackToEmail} className="forgotpassword-back">
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 className="forgotpassword-title">Đặt lại mật khẩu</h1>
          <p className="forgotpassword-description">
            Nhập mã OTP đã được gửi đến <strong>{email}</strong> và mật khẩu mới của bạn.
          </p>
        </div>

        {message && !error && (
          <div className="forgotpassword-success" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
            <CheckCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            {message}
          </div>
        )}

        {error && (
          <div className="forgotpassword-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitReset} className="forgotpassword-form">
          <div className="forgotpassword-field">
            <label htmlFor="otp" className="forgotpassword-label">
              Mã OTP (6 chữ số)
            </label>
            <div className="forgotpassword-input-container">
              <Key className="forgotpassword-input-icon" />
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="forgotpassword-input"
                placeholder="Nhập mã OTP 6 chữ số"
                maxLength={6}
                required
              />
            </div>
          </div>

          <div className="forgotpassword-field">
            <label htmlFor="newPassword" className="forgotpassword-label">
              Mật khẩu mới
            </label>
            <div className="forgotpassword-input-container">
              <Lock className="forgotpassword-input-icon" />
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="forgotpassword-input"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="forgotpassword-field">
            <label htmlFor="confirmPassword" className="forgotpassword-label">
              Xác nhận mật khẩu
            </label>
            <div className="forgotpassword-input-container">
              <Lock className="forgotpassword-input-icon" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="forgotpassword-input"
                placeholder="Nhập lại mật khẩu mới"
                minLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="forgotpassword-button"
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="forgotpassword-footer">
          <p>
            Không nhận được mã?{' '}
            <button onClick={handleBackToEmail} className="forgotpassword-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Gửi lại
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};