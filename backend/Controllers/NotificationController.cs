using EVTB_Backend.Data;
using EVTB_Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EVTB_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(EVTBContext context, ILogger<NotificationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách thông báo của user
        /// </summary>
        [HttpGet("user/{userId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetUserNotifications(int userId)
        {
            try
            {
                // Get current user ID from JWT token
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Check if user is requesting their own notifications or is admin
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == currentUserId);
                if (user == null || (user.RoleId != 1 && currentUserId != userId))
                {
                    return Forbid("Bạn chỉ có thể xem thông báo của mình");
                }

                // For now, return empty array since we don't have a Notifications table
                // This is just to prevent 403 errors
                var notifications = new List<object>();

                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting notifications for user {userId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách thông báo" });
            }
        }

        /// <summary>
        /// Đánh dấu thông báo là đã đọc
        /// </summary>
        [HttpPut("{notificationId}/read")]
        [Authorize]
        public async Task<ActionResult<object>> MarkAsRead(int notificationId)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // For now, just return success since we don't have a Notifications table
                return Ok(new { message = "Thông báo đã được đánh dấu là đã đọc" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking notification {notificationId} as read for user {userIdClaim?.Value}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi đánh dấu thông báo" });
            }
        }
    }
}
