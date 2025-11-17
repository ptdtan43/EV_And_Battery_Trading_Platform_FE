using EVTB_Backend.Services;

namespace EVTB_Backend
{
    public partial class Program
    {
        public static void ConfigureServices(WebApplicationBuilder builder)
        {
            // ... existing services ...

            // Đăng ký Email Service
            builder.Services.AddScoped<IEmailService, EmailService>();

            // Đăng ký Password Reset Service
            builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();

            // ... existing services ...
        }
    }
}

// Nếu bạn đã có Program.cs, hãy thêm các dòng sau vào method ConfigureServices hoặc trong builder.Services:

/*
// Thêm vào Program.cs hiện tại:

// Đăng ký Email Service
builder.Services.AddScoped<IEmailService, EmailService>();

// Đăng ký Password Reset Service  
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
*/
