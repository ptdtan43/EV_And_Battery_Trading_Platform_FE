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
    public class ProductImageController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<ProductImageController> _logger;

        public ProductImageController(EVTBContext context, ILogger<ProductImageController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy hình ảnh của sản phẩm
        /// </summary>
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetProductImages(int productId)
        {
            try
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == productId);
                if (product == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });
                }

                // Trả về mảng rỗng vì chưa có hệ thống lưu trữ hình ảnh
                return Ok(new List<object>());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting images for product {productId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy hình ảnh sản phẩm" });
            }
        }

        /// <summary>
        /// Upload hình ảnh cho sản phẩm
        /// </summary>
        [HttpPost("{productId}")]
        public async Task<IActionResult> UploadProductImage(int productId, [FromForm] IFormFile file)
        {
            try
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == productId);
                if (product == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });
                }

                // Tạm thời trả về success vì chưa có hệ thống lưu trữ hình ảnh
                return Ok(new { message = "Upload thành công", imageId = Guid.NewGuid().ToString() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading image for product {productId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi upload hình ảnh" });
            }
        }

        /// <summary>
        /// Upload nhiều hình ảnh
        /// </summary>
        [HttpPost("multiple")]
        public async Task<IActionResult> UploadMultipleImages([FromForm] IFormFileCollection files)
        {
            try
            {
                // Tạm thời trả về success vì chưa có hệ thống lưu trữ hình ảnh
                var imageIds = files.Select(f => Guid.NewGuid().ToString()).ToList();
                return Ok(new { message = "Upload thành công", imageIds });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading multiple images");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi upload hình ảnh" });
            }
        }

        /// <summary>
        /// Xóa hình ảnh
        /// </summary>
        [HttpDelete("{imageId}")]
        public async Task<IActionResult> DeleteImage(string imageId)
        {
            try
            {
                // Tạm thời trả về success vì chưa có hệ thống lưu trữ hình ảnh
                return Ok(new { message = "Xóa hình ảnh thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting image {imageId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa hình ảnh" });
            }
        }
    }
}
