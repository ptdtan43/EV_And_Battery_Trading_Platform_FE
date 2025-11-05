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
    public class MessageController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<MessageController> _logger;

        public MessageController(EVTBContext context, ILogger<MessageController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy số lượng tin nhắn chưa đọc
        /// </summary>
        [HttpGet("unread-count")]
        [Authorize]
        public async Task<ActionResult<object>> GetUnreadCount()
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Count unread messages for this user
                var unreadCount = await _context.ChatMessages
                    .Where(m => m.ReceiverId == userId && !m.IsRead)
                    .CountAsync();

                return Ok(new { unreadCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting unread count for user {userIdClaim?.Value}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy số lượng tin nhắn chưa đọc" });
            }
        }

        /// <summary>
        /// Lấy danh sách tin nhắn chưa đọc
        /// </summary>
        [HttpGet("unread")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetUnreadMessages()
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var unreadMessages = await _context.ChatMessages
                    .Include(m => m.Sender)
                    .Include(m => m.Chat)
                    .Where(m => m.ReceiverId == userId && !m.IsRead)
                    .Select(m => new
                    {
                        messageId = m.MessageId,
                        chatId = m.ChatId,
                        senderId = m.SenderId,
                        senderName = m.Sender.FullName,
                        content = m.Content,
                        createdAt = m.CreatedAt,
                        isRead = m.IsRead
                    })
                    .OrderByDescending(m => m.createdAt)
                    .ToListAsync();

                return Ok(unreadMessages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting unread messages for user {userIdClaim?.Value}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách tin nhắn chưa đọc" });
            }
        }

        /// <summary>
        /// Đánh dấu tin nhắn là đã đọc
        /// </summary>
        [HttpPut("{messageId}/read")]
        [Authorize]
        public async Task<ActionResult<object>> MarkAsRead(int messageId)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var message = await _context.ChatMessages
                    .FirstOrDefaultAsync(m => m.MessageId == messageId && m.ReceiverId == userId);

                if (message == null)
                {
                    return NotFound(new { message = "Không tìm thấy tin nhắn" });
                }

                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Tin nhắn đã được đánh dấu là đã đọc" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking message {messageId} as read for user {userIdClaim?.Value}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi đánh dấu tin nhắn" });
            }
        }
    }
}
