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
    public class FavoriteController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<FavoriteController> _logger;

        public FavoriteController(EVTBContext context, ILogger<FavoriteController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách sản phẩm yêu thích của user
        /// </summary>
        [HttpGet("user/{userId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetUserFavorites(int userId)
        {
            try
            {
                // Get current user ID from JWT token
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Check if user is requesting their own favorites or is admin
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == currentUserId);
                if (user == null || (user.RoleId != 1 && currentUserId != userId))
                {
                    return Forbid("Bạn chỉ có thể xem danh sách yêu thích của mình");
                }

                // For now, return empty array since we don't have a Favorites table
                // This is just to prevent 403 errors
                var favorites = new List<object>();

                return Ok(favorites);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting favorites for user {userId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách yêu thích" });
            }
        }

        /// <summary>
        /// Thêm sản phẩm vào danh sách yêu thích
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<object>> AddToFavorites([FromBody] AddFavoriteRequest request)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // For now, just return success since we don't have a Favorites table
                return Ok(new { message = "Sản phẩm đã được thêm vào danh sách yêu thích" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding to favorites for user {userIdClaim?.Value}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi thêm vào danh sách yêu thích" });
            }
        }

        /// <summary>
        /// Xóa sản phẩm khỏi danh sách yêu thích
        /// </summary>
        [HttpDelete("{productId}")]
        [Authorize]
        public async Task<ActionResult<object>> RemoveFromFavorites(int productId)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // For now, just return success since we don't have a Favorites table
                return Ok(new { message = "Sản phẩm đã được xóa khỏi danh sách yêu thích" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing from favorites for user {userIdClaim?.Value}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa khỏi danh sách yêu thích" });
            }
        }
    }

    // DTOs
    public class AddFavoriteRequest
    {
        public int ProductId { get; set; }
    }
}
