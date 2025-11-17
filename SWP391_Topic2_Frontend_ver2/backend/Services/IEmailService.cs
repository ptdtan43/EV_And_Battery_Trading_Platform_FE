namespace EVTB_Backend.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetToken, string userName);
        Task SendWelcomeEmailAsync(string email, string userName);
    }
}
