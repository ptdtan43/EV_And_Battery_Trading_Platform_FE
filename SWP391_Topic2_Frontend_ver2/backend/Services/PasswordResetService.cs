using EVTB_Backend.Data;
using EVTB_Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace EVTB_Backend.Services
{
    public class PasswordResetService : IPasswordResetService
    {
        private readonly EVTBContext _context;
        private readonly ILogger<PasswordResetService> _logger;
        private readonly TimeSpan _tokenExpiryTime = TimeSpan.FromHours(1); // Token hết hạn sau 1 giờ

        public PasswordResetService(EVTBContext context, ILogger<PasswordResetService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<string> GeneratePasswordResetTokenAsync(string email)
        {
            try
            {
                // Tìm user theo email
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null)
                {
                    _logger.LogWarning($"User not found for email: {email}");
                    return string.Empty;
                }

                // Tạo token ngẫu nhiên
                var token = GenerateSecureToken();

                // Lưu token vào database
                user.ResetPasswordToken = token;
                user.ResetPasswordTokenExpiry = DateTime.UtcNow.Add(_tokenExpiryTime);

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Password reset token generated for user: {email}");

                return token;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating password reset token for email: {email}");
                throw;
            }
        }

        public async Task<bool> ValidatePasswordResetTokenAsync(string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return false;
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.ResetPasswordToken == token 
                                           && u.ResetPasswordTokenExpiry > DateTime.UtcNow);

                return user != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating password reset token: {token}");
                return false;
            }
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            try
            {
                if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(newPassword))
                {
                    return false;
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.ResetPasswordToken == token 
                                           && u.ResetPasswordTokenExpiry > DateTime.UtcNow);

                if (user == null)
                {
                    _logger.LogWarning($"Invalid or expired token: {token}");
                    return false;
                }

                // Hash password mới
                user.Password = HashPassword(newPassword);

                // Xóa token sau khi reset thành công
                user.ResetPasswordToken = null;
                user.ResetPasswordTokenExpiry = null;

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Password reset successfully for user: {user.Email}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error resetting password with token: {token}");
                return false;
            }
        }

        public async Task CleanupExpiredTokensAsync()
        {
            try
            {
                var expiredUsers = await _context.Users
                    .Where(u => u.ResetPasswordTokenExpiry.HasValue 
                            && u.ResetPasswordTokenExpiry < DateTime.UtcNow)
                    .ToListAsync();

                foreach (var user in expiredUsers)
                {
                    user.ResetPasswordToken = null;
                    user.ResetPasswordTokenExpiry = null;
                }

                if (expiredUsers.Any())
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Cleaned up {expiredUsers.Count} expired password reset tokens");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up expired tokens");
            }
        }

        private string GenerateSecureToken()
        {
            // Tạo token 32 bytes (256 bits) và chuyển thành base64
            using var rng = RandomNumberGenerator.Create();
            var tokenBytes = new byte[32];
            rng.GetBytes(tokenBytes);
            return Convert.ToBase64String(tokenBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        }

        private string HashPassword(string password)
        {
            // Sử dụng BCrypt để hash password
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
}
