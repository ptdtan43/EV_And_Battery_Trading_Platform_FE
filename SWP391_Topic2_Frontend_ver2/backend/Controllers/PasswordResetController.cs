using EVTB_Backend.DTOs;
using EVTB_Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace EVTB_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PasswordResetController : ControllerBase
    {
        private readonly IPasswordResetService _passwordResetService;
        private readonly IEmailService _emailService;
        private readonly ILogger<PasswordResetController> _logger;

        public PasswordResetController(
            IPasswordResetService passwordResetService,
            IEmailService emailService,
            ILogger<PasswordResetController> logger)
        {
            _passwordResetService = passwordResetService;
            _emailService = emailService;
            _logger = logger;
        }

        /// <summary>
        /// Gửi email reset password
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<ActionResult<ApiResponse<object>>> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return BadRequest(ApiResponse<object>.ErrorResult("Dữ liệu không hợp lệ", errors));
                }

                _logger.LogInformation($"Forgot password request for email: {request.Email}");

                // Tạo token reset password
                var resetToken = await _passwordResetService.GeneratePasswordResetTokenAsync(request.Email);
                
                if (string.IsNullOrEmpty(resetToken))
                {
                    // Không tìm thấy user nhưng vẫn trả về success để bảo mật
                    return Ok(ApiResponse<object>.SuccessResult(
                        "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu.",
                        null
                    ));
                }

                // Gửi email reset password
                await _emailService.SendPasswordResetEmailAsync(request.Email, resetToken, request.Email);

                // Trong development mode, trả về token để test
                var response = new
                {
                    success = true,
                    message = "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu.",
                    // Chỉ trả về token trong development
                    resetToken = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" ? resetToken : null
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in forgot password for email: {request.Email}");
                return StatusCode(500, ApiResponse<object>.ErrorResult("Có lỗi xảy ra khi xử lý yêu cầu"));
            }
        }

        /// <summary>
        /// Đặt lại mật khẩu mới
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<ActionResult<ApiResponse<object>>> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return BadRequest(ApiResponse<object>.ErrorResult("Dữ liệu không hợp lệ", errors));
                }

                _logger.LogInformation($"Reset password request with token: {request.Token.Substring(0, 8)}...");

                // Validate token
                var isValidToken = await _passwordResetService.ValidatePasswordResetTokenAsync(request.Token);
                if (!isValidToken)
                {
                    return BadRequest(ApiResponse<object>.ErrorResult(
                        "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới."
                    ));
                }

                // Reset password
                var success = await _passwordResetService.ResetPasswordAsync(request.Token, request.NewPassword);
                if (!success)
                {
                    return BadRequest(ApiResponse<object>.ErrorResult(
                        "Không thể đặt lại mật khẩu. Vui lòng thử lại."
                    ));
                }

                return Ok(ApiResponse<object>.SuccessResult(
                    "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới."
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in reset password with token: {request.Token?.Substring(0, 8)}...");
                return StatusCode(500, ApiResponse<object>.ErrorResult("Có lỗi xảy ra khi đặt lại mật khẩu"));
            }
        }

        /// <summary>
        /// Validate token reset password (để check token trước khi hiển thị form)
        /// </summary>
        [HttpGet("validate-token")]
        public async Task<ActionResult<ApiResponse<bool>>> ValidateToken([FromQuery] string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest(ApiResponse<bool>.ErrorResult("Token không được để trống"));
                }

                var isValid = await _passwordResetService.ValidatePasswordResetTokenAsync(token);
                
                return Ok(ApiResponse<bool>.SuccessResult(
                    isValid ? "Token hợp lệ" : "Token không hợp lệ hoặc đã hết hạn",
                    isValid
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating token: {token?.Substring(0, 8)}...");
                return StatusCode(500, ApiResponse<bool>.ErrorResult("Có lỗi xảy ra khi xác thực token"));
            }
        }

        /// <summary>
        /// Cleanup expired tokens (có thể gọi định kỳ)
        /// </summary>
        [HttpPost("cleanup-expired-tokens")]
        public async Task<ActionResult<ApiResponse<object>>> CleanupExpiredTokens()
        {
            try
            {
                await _passwordResetService.CleanupExpiredTokensAsync();
                return Ok(ApiResponse<object>.SuccessResult("Đã dọn dẹp các token hết hạn"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up expired tokens");
                return StatusCode(500, ApiResponse<object>.ErrorResult("Có lỗi xảy ra khi dọn dẹp token"));
            }
        }
    }
}
