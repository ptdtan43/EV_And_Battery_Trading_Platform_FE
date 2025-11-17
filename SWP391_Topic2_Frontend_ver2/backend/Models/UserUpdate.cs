using System.ComponentModel.DataAnnotations;

namespace EVTB_Backend.Models
{
    public class UserUpdate
    {
        public int UserId { get; set; }

        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;

        public string? FullName { get; set; }

        public string? Phone { get; set; }

        public int? RoleId { get; set; }

        public string? AccountStatus { get; set; }

        public string? Avatar { get; set; }

        // Fields cho password reset
        public string? ResetPasswordToken { get; set; }
        public DateTime? ResetPasswordTokenExpiry { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
