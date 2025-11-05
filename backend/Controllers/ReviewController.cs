using Microsoft.AspNetCore.Mvc;
using BE.API.DTOs.Request;

namespace EVTB_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        /// <summary>
        /// Test endpoint để kiểm tra API hoạt động
        /// </summary>
        [HttpGet("test")]
        public ActionResult<object> Test()
        {
            return Ok(new { message = "Review API is working!", timestamp = DateTime.UtcNow });
        }

        /// <summary>
        /// Tạo review mới
        /// </summary>
        [HttpPost]
        public ActionResult<object> CreateReview([FromBody] ReviewRequest request)
        {
            try
            {
                // Debug: Log raw request body
                using (var reader = new StreamReader(Request.Body))
                {
                    var rawBody = reader.ReadToEndAsync().Result;
                    Console.WriteLine($"🔍 Raw Request Body: {rawBody}");
                }
                
                // Log để debug
                Console.WriteLine($"Received ReviewRequest: OrderId={request.OrderId}, RevieweeId={request.RevieweeId}, Rating={request.Rating}, Content='{request.Content}'");
                Console.WriteLine($"🔍 RevieweeId from request: {request.RevieweeId}");
                
                // Mock response - trong thực tế sẽ lưu vào database
                var revieweeName = request.RevieweeId == 1 ? "Anh Duy Bui" : 
                                  request.RevieweeId == 2 ? "Duy toi choi" : "Unknown User";
                var response = new
                {
                    message = "Đánh giá đã được tạo thành công",
                    reviewId = 1,
                    orderId = request.OrderId,
                    revieweeId = request.RevieweeId,
                    rating = request.Rating,
                    content = request.Content,
                    revieweeName = revieweeName,
                    createdAt = DateTime.UtcNow
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating review: {ex.Message}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo đánh giá", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách review của seller
        /// </summary>
        [HttpGet("reviewee/{revieweeId}")]
        public ActionResult<object> GetSellerReviews(int revieweeId)
        {
            try
            {
                Console.WriteLine($"🔍 Getting reviews for revieweeId: {revieweeId}");
                
                // Mock data based on actual reviews from user
                var reviews = new[]
                {
                    new
                    {
                        reviewId = 1,
                        orderId = 23,
                        reviewerId = 9,
                        reviewerName = "Thái Tử Gò Vấp",
                        revieweeId = 1,
                        revieweeName = "Anh Duy Bui",
                        rating = 5,
                        content = "ok",
                        createdDate = "2025-10-25T10:34:39.4101141"
                    },
                    new
                    {
                        reviewId = 2,
                        orderId = 23,
                        reviewerId = 9,
                        reviewerName = "Thái Tử Gò Vấp",
                        revieweeId = 1,
                        revieweeName = "Anh Duy Bui",
                        rating = 5,
                        content = "ok",
                        createdDate = "2025-10-25T11:04:20.4093198"
                    },
                    new
                    {
                        reviewId = 3,
                        orderId = 38,
                        reviewerId = 9,
                        reviewerName = "Thái Tử Gò Vấp",
                        revieweeId = 1,
                        revieweeName = "Anh Duy Bui",
                        rating = 5,
                        content = "ok",
                        createdDate = "2025-10-25T11:05:01.352707"
                    },
                    // Add reviews for userId 2 (current logged in user)
                    new
                    {
                        reviewId = 4,
                        orderId = 39,
                        reviewerId = 1,
                        reviewerName = "Duy toi choi",
                        revieweeId = 2,
                        revieweeName = "Duy toi choi",
                        rating = 4,
                        content = "Sản phẩm tốt",
                        createdDate = "2025-10-25T12:00:00.0000000"
                    },
                    new
                    {
                        reviewId = 5,
                        orderId = 40,
                        reviewerId = 1,
                        reviewerName = "Duy toi choi",
                        revieweeId = 2,
                        revieweeName = "Duy toi choi",
                        rating = 5,
                        content = "Rất hài lòng",
                        createdDate = "2025-10-25T12:30:00.0000000"
                    }
                };

                // Filter reviews for the specific revieweeId
                var filteredReviews = reviews.Where(r => r.revieweeId == revieweeId).ToArray();
                Console.WriteLine($"🔍 Found {filteredReviews.Length} reviews for revieweeId {revieweeId}");

                return Ok(filteredReviews);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting reviews: {ex.Message}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy đánh giá", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách tất cả review
        /// </summary>
        [HttpGet]
        public ActionResult<object> GetAllReviews()
        {
            try
            {
                // Mock data based on actual reviews from user
                var reviews = new[]
                {
                    new
                    {
                        reviewId = 1,
                        orderId = 23,
                        reviewerId = 9,
                        reviewerName = "Thái Tử Gò Vấp",
                        revieweeId = 1,
                        revieweeName = "Anh Duy Bui",
                        rating = 5,
                        content = "ok",
                        createdDate = "2025-10-25T10:34:39.4101141"
                    },
                    new
                    {
                        reviewId = 2,
                        orderId = 23,
                        reviewerId = 9,
                        reviewerName = "Thái Tử Gò Vấp",
                        revieweeId = 1,
                        revieweeName = "Anh Duy Bui",
                        rating = 5,
                        content = "ok",
                        createdDate = "2025-10-25T11:04:20.4093198"
                    },
                    new
                    {
                        reviewId = 3,
                        orderId = 38,
                        reviewerId = 9,
                        reviewerName = "Thái Tử Gò Vấp",
                        revieweeId = 1,
                        revieweeName = "Anh Duy Bui",
                        rating = 5,
                        content = "ok",
                        createdDate = "2025-10-25T11:05:01.352707"
                    },
                    // Add reviews for userId 2 (current logged in user)
                    new
                    {
                        reviewId = 4,
                        orderId = 39,
                        reviewerId = 1,
                        reviewerName = "Duy toi choi",
                        revieweeId = 2,
                        revieweeName = "Duy toi choi",
                        rating = 4,
                        content = "Sản phẩm tốt",
                        createdDate = "2025-10-25T12:00:00.0000000"
                    },
                    new
                    {
                        reviewId = 5,
                        orderId = 40,
                        reviewerId = 1,
                        reviewerName = "Duy toi choi",
                        revieweeId = 2,
                        revieweeName = "Duy toi choi",
                        rating = 5,
                        content = "Rất hài lòng",
                        createdDate = "2025-10-25T12:30:00.0000000"
                    }
                };

                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy đánh giá", error = ex.Message });
            }
        }
    }
}
