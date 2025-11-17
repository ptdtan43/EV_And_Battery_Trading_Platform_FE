using System.Net;
using System.Net.Mail;
using System.Text;

namespace EVTB_Backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken, string userName)
        {
            try
            {
                // Trong môi trường development, chỉ log thông tin
                if (_configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development")
                {
                    _logger.LogInformation("=== EMAIL RESET PASSWORD ===");
                    _logger.LogInformation($"To: {email}");
                    _logger.LogInformation($"UserName: {userName}");
                    _logger.LogInformation($"Reset Token: {resetToken}");
                    _logger.LogInformation($"Reset Link: {GetFrontendUrl()}/reset-password?token={resetToken}");
                    _logger.LogInformation("=============================");
                    return;
                }

                // Trong production, gửi email thật
                var smtpSettings = _configuration.GetSection("EmailSettings");
                var smtpHost = smtpSettings["SmtpHost"];
                var smtpPort = smtpSettings.GetValue<int>("SmtpPort", 587);
                var smtpUsername = smtpSettings["SmtpUsername"];
                var smtpPassword = smtpSettings["SmtpPassword"];
                var fromEmail = smtpSettings["FromEmail"];
                var fromName = smtpSettings["FromName"];

                if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(fromEmail))
                {
                    _logger.LogWarning("Email settings not configured, skipping email send");
                    return;
                }

                using var client = new SmtpClient(smtpHost, smtpPort);
                client.EnableSsl = true;
                client.Credentials = new NetworkCredential(smtpUsername, smtpPassword);

                var resetLink = $"{GetFrontendUrl()}/reset-password?token={resetToken}";
                
                var subject = "Đặt lại mật khẩu - EV Trading Platform";
                var body = CreatePasswordResetEmailBody(userName, resetLink);

                var message = new MailMessage();
                message.From = new MailAddress(fromEmail, fromName);
                message.To.Add(email);
                message.Subject = subject;
                message.Body = body;
                message.IsBodyHtml = true;
                message.BodyEncoding = Encoding.UTF8;
                message.SubjectEncoding = Encoding.UTF8;

                await client.SendMailAsync(message);
                _logger.LogInformation($"Password reset email sent successfully to {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send password reset email to {email}");
                throw;
            }
        }

        public async Task SendWelcomeEmailAsync(string email, string userName)
        {
            try
            {
                // Trong môi trường development, chỉ log thông tin
                if (_configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development")
                {
                    _logger.LogInformation("=== WELCOME EMAIL ===");
                    _logger.LogInformation($"To: {email}");
                    _logger.LogInformation($"UserName: {userName}");
                    _logger.LogInformation("===================");
                    return;
                }

                // Implementation cho welcome email ở đây
                // Tương tự như password reset email
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send welcome email to {email}");
                throw;
            }
        }

        private string GetFrontendUrl()
        {
            return _configuration.GetValue<string>("FrontendUrl") ?? "http://localhost:3000";
        }

        private string CreatePasswordResetEmailBody(string userName, string resetLink)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Đặt lại mật khẩu</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
        .button {{ display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>EV Trading Platform</h1>
        </div>
        <div class='content'>
            <h2>Xin chào {userName}!</h2>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
            <p style='text-align: center;'>
                <a href='{resetLink}' class='button'>Đặt lại mật khẩu</a>
            </p>
            <p>Hoặc sao chép và dán liên kết này vào trình duyệt:</p>
            <p style='word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;'>
                {resetLink}
            </p>
            <p><strong>Lưu ý:</strong></p>
            <ul>
                <li>Liên kết này chỉ có hiệu lực trong 1 giờ</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này</li>
                <li>Mật khẩu của bạn sẽ không thay đổi cho đến khi bạn nhấp vào liên kết và tạo mật khẩu mới</li>
            </ul>
        </div>
        <div class='footer'>
            <p>Email này được gửi từ EV Trading Platform</p>
            <p>Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}
