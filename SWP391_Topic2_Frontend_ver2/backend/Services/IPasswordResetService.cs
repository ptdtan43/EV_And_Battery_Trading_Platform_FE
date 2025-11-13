namespace EVTB_Backend.Services
{
    public interface IPasswordResetService
    {
        Task<string> GeneratePasswordResetTokenAsync(string email);
        Task<bool> ValidatePasswordResetTokenAsync(string token);
        Task<bool> ResetPasswordAsync(string token, string newPassword);
        Task CleanupExpiredTokensAsync();
    }
}
