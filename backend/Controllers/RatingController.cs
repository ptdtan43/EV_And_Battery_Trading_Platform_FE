/*
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
    public class RatingController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<RatingController> _logger;

        public RatingController(EVTBContext context, ILogger<RatingController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Tạo review mới cho sản phẩm
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<object>> CreateRating([FromBody] CreateRatingRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return BadRequest(new { message = "Dữ liệu không hợp lệ", errors });
                }

                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Verify order exists and belongs to user
                var order = await _context.Orders
                    .Include(o => o.Product)
                    .Include(o => o.User)
                    .Include(o => o.Seller)
                    .FirstOrDefaultAsync(o => o.OrderId == request.OrderId);

                if (order == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn hàng" });
                }

                if (order.UserId != userId)
                {
                    return Forbid("Bạn chỉ có thể đánh giá sản phẩm mà bạn đã mua");
                }

                if (order.OrderStatus != "completed")
                {
                    return BadRequest(new { message = "Chỉ có thể đánh giá sản phẩm đã hoàn thành" });
                }

                // Check if rating already exists
                var existingRating = await _context.Ratings
                    .FirstOrDefaultAsync(r => r.OrderId == request.OrderId);

                if (existingRating != null)
                {
                    return BadRequest(new { message = "Bạn đã đánh giá sản phẩm này rồi" });
                }

                // Create new rating
                var rating = new Rating
                {
                    OrderId = request.OrderId,
                    ProductId = request.ProductId,
                    BuyerId = request.BuyerId,
                    SellerId = request.SellerId,
                    RatingValue = request.RatingValue,
                    Comment = request.Comment ?? "",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Ratings.Add(rating);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Rating {rating.RatingId} created for product {request.ProductId} by buyer {userId}");

                return Ok(new
                {
                    message = "Đánh giá đã được tạo thành công",
                    ratingId = rating.RatingId,
                    productId = rating.ProductId,
                    buyerId = rating.BuyerId,
                    sellerId = rating.SellerId,
                    ratingValue = rating.RatingValue,
                    comment = rating.Comment,
                    createdAt = rating.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating rating for order {request?.OrderId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo đánh giá" });
            }
        }

        /// <summary>
        /// Cập nhật review
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> UpdateRating(int id, [FromBody] UpdateRatingRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return BadRequest(new { message = "Dữ liệu không hợp lệ", errors });
                }

                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var rating = await _context.Ratings
                    .FirstOrDefaultAsync(r => r.RatingId == id);

                if (rating == null)
                {
                    return NotFound(new { message = "Không tìm thấy đánh giá" });
                }

                if (rating.BuyerId != userId)
                {
                    return Forbid("Bạn chỉ có thể cập nhật đánh giá của mình");
                }

                // Update rating
                rating.RatingValue = request.RatingValue;
                rating.Comment = request.Comment ?? rating.Comment;
                rating.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Rating {id} updated by buyer {userId}");

                return Ok(new
                {
                    message = "Đánh giá đã được cập nhật thành công",
                    ratingId = rating.RatingId,
                    ratingValue = rating.RatingValue,
                    comment = rating.Comment,
                    updatedAt = rating.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating rating {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật đánh giá" });
            }
        }

        /// <summary>
        /// Lấy danh sách review của user
        /// </summary>
        [HttpGet("my-ratings")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetMyRatings()
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var ratings = await _context.Ratings
                    .Include(r => r.Product)
                    .Include(r => r.Order)
                    .Include(r => r.Seller)
                    .Where(r => r.BuyerId == userId)
                    .Select(r => new
                    {
                        ratingId = r.RatingId,
                        orderId = r.OrderId,
                        productId = r.ProductId,
                        productTitle = r.Product.Title,
                        sellerId = r.SellerId,
                        sellerName = r.Seller.FullName,
                        ratingValue = r.RatingValue,
                        comment = r.Comment,
                        createdAt = r.CreatedAt,
                        updatedAt = r.UpdatedAt
                    })
                    .OrderByDescending(r => r.createdAt)
                    .ToListAsync();

                return Ok(ratings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting ratings for user {userId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách đánh giá" });
            }
        }

        /// <summary>
        /// Lấy danh sách review của sản phẩm
        /// </summary>
        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetProductRatings(int productId)
        {
            try
            {
                var ratings = await _context.Ratings
                    .Include(r => r.Buyer)
                    .Where(r => r.ProductId == productId)
                    .Select(r => new
                    {
                        ratingId = r.RatingId,
                        buyerId = r.BuyerId,
                        buyerName = r.Buyer.FullName,
                        ratingValue = r.RatingValue,
                        comment = r.Comment,
                        createdAt = r.CreatedAt
                    })
                    .OrderByDescending(r => r.createdAt)
                    .ToListAsync();

                return Ok(ratings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting ratings for product {productId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy đánh giá sản phẩm" });
            }
        }

        /// <summary>
        /// Lấy danh sách review của seller và tính điểm trung bình
        /// </summary>
        [HttpGet("seller/{sellerId}")]
        public async Task<ActionResult<object>> GetSellerRatings(int sellerId)
        {
            try
            {
                var ratings = await _context.Ratings
                    .Include(r => r.Buyer)
                    .Include(r => r.Product)
                    .Where(r => r.SellerId == sellerId)
                    .Select(r => new
                    {
                        ratingId = r.RatingId,
                        buyerId = r.BuyerId,
                        buyerName = r.Buyer.FullName,
                        productId = r.ProductId,
                        productTitle = r.Product.Title,
                        ratingValue = r.RatingValue,
                        comment = r.Comment,
                        createdAt = r.CreatedAt
                    })
                    .OrderByDescending(r => r.createdAt)
                    .ToListAsync();

                // Calculate average rating
                var averageRating = ratings.Any() ? ratings.Average(r => r.ratingValue) : 0;
                var totalRatings = ratings.Count;

                return Ok(new
                {
                    ratings = ratings,
                    averageRating = Math.Round(averageRating, 1),
                    totalRatings = totalRatings
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting ratings for seller {sellerId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy đánh giá seller" });
            }
        }
    }

    // DTOs
    public class CreateRatingRequest
    {
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public int BuyerId { get; set; }
        public int SellerId { get; set; }
        public int RatingValue { get; set; }
        public string? Comment { get; set; }
    }

    public class UpdateRatingRequest
    {
        public int RatingValue { get; set; }
        public string? Comment { get; set; }
    }
}
*/