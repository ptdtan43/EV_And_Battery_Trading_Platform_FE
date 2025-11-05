using Microsoft.AspNetCore.Mvc;

namespace EVTB_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RatingController : ControllerBase
    {
        /// <summary>
        /// Test endpoint để kiểm tra API hoạt động
        /// </summary>
        [HttpGet("test")]
        public ActionResult<object> Test()
        {
            return Ok(new { message = "Rating API is working!", timestamp = DateTime.UtcNow });
        }

        /// <summary>
        /// Lấy danh sách review của seller và tính điểm trung bình
        /// </summary>
        [HttpGet("seller/{sellerId}")]
        public ActionResult<object> GetSellerRatings(int sellerId)
        {
            try
            {
                // Mock data for testing
                var mockRatings = new[]
                {
                    new
                    {
                        ratingId = 1,
                        buyerId = 9,
                        buyerName = "Test Buyer",
                        productId = 20,
                        productTitle = "Xe mới về 99%",
                        ratingValue = 5,
                        comment = "Sản phẩm rất tốt",
                        createdAt = DateTime.UtcNow.AddDays(-1)
                    },
                    new
                    {
                        ratingId = 2,
                        buyerId = 10,
                        buyerName = "Another Buyer",
                        productId = 20,
                        productTitle = "Xe mới về 99%",
                        ratingValue = 4,
                        comment = "Hài lòng",
                        createdAt = DateTime.UtcNow.AddDays(-2)
                    }
                };

                // Calculate average rating
                var averageRating = mockRatings.Average(r => r.ratingValue);
                var totalRatings = mockRatings.Length;

                return Ok(new
                {
                    ratings = mockRatings,
                    averageRating = Math.Round(averageRating, 1),
                    totalRatings = totalRatings
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy đánh giá seller", error = ex.Message });
            }
        }

        /// <summary>
        /// Tạo review mới cho sản phẩm
        /// </summary>
        [HttpPost]
        public ActionResult<object> CreateRating([FromBody] CreateRatingRequest request)
        {
            try
            {
                // Mock response for testing
                return Ok(new
                {
                    message = "Đánh giá đã được tạo thành công",
                    ratingId = 123,
                    productId = request.ProductId,
                    buyerId = request.BuyerId,
                    sellerId = request.SellerId,
                    ratingValue = request.RatingValue,
                    comment = request.Comment,
                    createdAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo đánh giá", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách review của sản phẩm
        /// </summary>
        [HttpGet("product/{productId}")]
        public ActionResult<object> GetProductRatings(int productId)
        {
            try
            {
                // Mock data for testing
                var mockRatings = new[]
                {
                    new
                    {
                        ratingId = 1,
                        buyerId = 9,
                        buyerName = "Test Buyer",
                        ratingValue = 5,
                        comment = "Sản phẩm rất tốt",
                        createdAt = DateTime.UtcNow.AddDays(-1)
                    }
                };

                return Ok(mockRatings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy đánh giá sản phẩm", error = ex.Message });
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
}