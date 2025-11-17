using EVTB_Backend.Data;
using EVTB_Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace EVTB_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<ProductController> _logger;

        public ProductController(EVTBContext context, ILogger<ProductController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả sản phẩm
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetProducts()
        {
            try
            {
                var products = await _context.Products
                    .AsNoTracking()
                    .Include(p => p.Seller)
                    .Where(p => p.Status != "Sold" && p.Status != "Rejected" && p.Status != "Reserved") // Hide sold, rejected, and reserved products from public listings
                    .Select(p => new
                    {
                        id = p.ProductId,
                        productId = p.ProductId,
                        sellerId = p.SellerId,
                        title = p.Title,
                        name = p.Title,
                        description = p.Description,
                        price = p.Price,
                        status = p.Status,
                        verificationStatus = p.VerificationStatus,
                        rejectionReason = p.RejectionReason,
                        productType = p.ProductType,
                        vehicleType = p.VehicleType,
                        manufactureYear = p.ManufactureYear,
                        mileage = p.Mileage,
                        licensePlate = p.LicensePlate,
                        warrantyPeriod = p.WarrantyPeriod,
                        batteryType = p.BatteryType,
                        batteryHealth = p.BatteryHealth,
                        capacity = p.Capacity,
                        voltage = p.Voltage,
                        bms = p.Bms,
                        cellType = p.CellType,
                        cycleCount = p.CycleCount,
                        approvedDate = p.ApprovedDate,
                        createdDate = p.CreatedAt,
                        createdAt = p.CreatedAt,
                        updatedAt = p.UpdatedAt,
                        seller = p.Seller != null ? new
                        {
                            id = p.Seller.UserId,
                            userId = p.Seller.UserId,
                            fullName = p.Seller.FullName,
                            email = p.Seller.Email,
                            phone = p.Seller.Phone
                        } : null
                    })
                    .ToListAsync();

                // ✅ DEBUG: Log seller information for first product
                if (products.Any())
                {
                    var firstProduct = products.First();
                    _logger.LogInformation($"First product seller info - SellerId: {firstProduct.sellerId}, FullName: {firstProduct.seller?.fullName}");
                }

                _logger.LogInformation($"Retrieved {products.Count} products");
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving products");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách sản phẩm" });
            }
        }

        /// <summary>
        /// Lấy sản phẩm theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetProduct(int id)
        {
            try
            {
                var product = await _context.Products
                    .AsNoTracking()
                    .Include(p => p.Seller)
                    .FirstOrDefaultAsync(p => p.ProductId == id);

                if (product == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });
                }

                var result = new
                {
                    id = product.ProductId,
                    productId = product.ProductId,
                    sellerId = product.SellerId,
                    title = product.Title,
                    name = product.Title,
                    description = product.Description,
                    price = product.Price,
                    status = product.Status,
                    verificationStatus = product.VerificationStatus,
                    rejectionReason = product.RejectionReason,
                    productType = product.ProductType,
                    vehicleType = product.VehicleType,
                    manufactureYear = product.ManufactureYear,
                    mileage = product.Mileage,
                    licensePlate = product.LicensePlate,
                    warrantyPeriod = product.WarrantyPeriod,
                    batteryType = product.BatteryType,
                    batteryHealth = product.BatteryHealth,
                    capacity = product.Capacity,
                    voltage = product.Voltage,
                    bms = product.Bms,
                    cellType = product.CellType,
                    cycleCount = product.CycleCount,
                    approvedDate = product.ApprovedDate,
                    createdDate = product.CreatedAt,
                    createdAt = product.CreatedAt,
                    updatedAt = product.UpdatedAt,
                    seller = new
                    {
                        id = product.Seller.UserId,
                        userId = product.Seller.UserId,
                        fullName = product.Seller.FullName,
                        email = product.Seller.Email,
                        phone = product.Seller.Phone
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving product {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin sản phẩm" });
            }
        }

        /// <summary>
        /// Lấy sản phẩm theo seller ID
        /// </summary>
        [HttpGet("seller/{sellerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetProductsBySeller(int sellerId)
        {
            try
            {
                var products = await _context.Products
                    .AsNoTracking()
                    .Include(p => p.Seller)
                    .Where(p => p.SellerId == sellerId)
                    .Select(p => new
                    {
                        id = p.ProductId,
                        productId = p.ProductId,
                        sellerId = p.SellerId,
                        title = p.Title,
                        name = p.Title,
                        description = p.Description,
                        price = p.Price,
                        status = p.Status,
                        verificationStatus = p.VerificationStatus,
                        rejectionReason = p.RejectionReason,
                        productType = p.ProductType,
                        vehicleType = p.VehicleType,
                        manufactureYear = p.ManufactureYear,
                        mileage = p.Mileage,
                        licensePlate = p.LicensePlate,
                        warrantyPeriod = p.WarrantyPeriod,
                        batteryType = p.BatteryType,
                        batteryHealth = p.BatteryHealth,
                        capacity = p.Capacity,
                        voltage = p.Voltage,
                        bms = p.Bms,
                        cellType = p.CellType,
                        cycleCount = p.CycleCount,
                        approvedDate = p.ApprovedDate,
                        createdDate = p.CreatedAt,
                        createdAt = p.CreatedAt,
                        updatedAt = p.UpdatedAt,
                        seller = new
                        {
                            id = p.Seller.UserId,
                            userId = p.Seller.UserId,
                            fullName = p.Seller.FullName,
                            email = p.Seller.Email,
                            phone = p.Seller.Phone
                        }
                    })
                    .ToListAsync();

                _logger.LogInformation($"Retrieved {products.Count} products for seller {sellerId}");
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving products for seller {sellerId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách sản phẩm của người bán" });
            }
        }

        /// <summary>
        /// Duyệt sản phẩm (Admin only) - ENDPOINT QUAN TRỌNG NHẤT
        /// </summary>
        [HttpPut("approve/{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<object>> ApproveProduct(int id)
        {
            try
            {
                // Check if user is admin
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (user == null || user.RoleId != 1) // RoleId = 1 là Admin
                {
                    return Forbid("Chỉ admin mới có thể duyệt sản phẩm");
                }

                var product = await _context.Products
                    .Include(p => p.Seller)
                    .FirstOrDefaultAsync(p => p.ProductId == id);

                if (product == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });
                }

                // Update product status - QUAN TRỌNG: Set status = "Active" để HomePage có thể lọc
                product.Status = "Active";
                product.VerificationStatus = "Approved";
                product.ApprovedDate = DateTime.UtcNow;
                product.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Product {id} approved by admin {userId}");

                var result = new
                {
                    id = product.ProductId,
                    productId = product.ProductId,
                    sellerId = product.SellerId,
                    title = product.Title,
                    status = product.Status,
                    verificationStatus = product.VerificationStatus,
                    approvedDate = product.ApprovedDate,
                    updatedAt = product.UpdatedAt,
                    message = "Sản phẩm đã được duyệt thành công"
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error approving product {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi duyệt sản phẩm" });
            }
        }

        /// <summary>
        /// Từ chối sản phẩm (Admin only)
        /// </summary>
        [HttpPut("reject/{id}")]
        [Authorize]
        public async Task<ActionResult<object>> RejectProduct(int id, [FromBody] RejectProductRequest request)
        {
            try
            {
                // Check if user is admin
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (user == null || user.RoleId != 1) // RoleId 1 = Admin
                {
                    return Forbid("Chỉ admin mới có thể từ chối sản phẩm");
                }

                var product = await _context.Products
                    .Include(p => p.Seller)
                    .FirstOrDefaultAsync(p => p.ProductId == id);

                if (product == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });
                }

                // Update product status
                product.Status = "Rejected";
                product.VerificationStatus = "Rejected";
                product.RejectionReason = request.RejectionReason;
                product.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Product {id} rejected by admin {userId}. Reason: {request.RejectionReason}");

                var result = new
                {
                    id = product.ProductId,
                    productId = product.ProductId,
                    sellerId = product.SellerId,
                    title = product.Title,
                    status = product.Status,
                    verificationStatus = product.VerificationStatus,
                    rejectionReason = product.RejectionReason,
                    updatedAt = product.UpdatedAt,
                    message = "Sản phẩm đã bị từ chối"
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error rejecting product {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi từ chối sản phẩm" });
            }
        }

        /// <summary>
        /// Tạo sản phẩm mới
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<object>> CreateProduct([FromBody] CreateProductRequest request)
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

                var product = new Product
                {
                    SellerId = userId,
                    Title = request.Title,
                    Description = request.Description,
                    Price = request.Price,
                    Status = "Pending",
                    VerificationStatus = "NotRequested",
                    ProductType = request.ProductType,
                    VehicleType = request.VehicleType,
                    ManufactureYear = request.ManufactureYear,
                    Mileage = request.Mileage,
                    LicensePlate = request.LicensePlate,
                    WarrantyPeriod = request.WarrantyPeriod,
                    BatteryType = request.BatteryType,
                    BatteryHealth = request.BatteryHealth,
                    Capacity = request.Capacity,
                    Voltage = request.Voltage,
                    Bms = request.Bms,
                    CellType = request.CellType,
                    CycleCount = request.CycleCount,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Product {product.ProductId} created by user {userId}");

                var result = new
                {
                    id = product.ProductId,
                    productId = product.ProductId,
                    sellerId = product.SellerId,
                    title = product.Title,
                    description = product.Description,
                    price = product.Price,
                    status = product.Status,
                    verificationStatus = product.VerificationStatus,
                    productType = product.ProductType,
                    createdAt = product.CreatedAt,
                    message = "Sản phẩm đã được tạo thành công"
                };

                return CreatedAtAction(nameof(GetProduct), new { id = product.ProductId }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo sản phẩm" });
            }
        }

        /// <summary>
        /// Cập nhật sản phẩm
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
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

                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == id);

                if (product == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });
                }

                // Check if user owns the product or is admin
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (product.SellerId != userId && (user == null || user.RoleId != 1))
                {
                    return Forbid("Bạn không có quyền cập nhật sản phẩm này");
                }

                // Update product fields
                product.Title = request.Title ?? product.Title;
                product.Description = request.Description ?? product.Description;
                if (request.Price.HasValue)
                {
                    product.Price = request.Price.Value;
                }
                product.ProductType = request.ProductType ?? product.ProductType;
                product.VehicleType = request.VehicleType ?? product.VehicleType;
                product.ManufactureYear = request.ManufactureYear ?? product.ManufactureYear;
                product.Mileage = request.Mileage ?? product.Mileage;
                product.LicensePlate = request.LicensePlate ?? product.LicensePlate;
                product.WarrantyPeriod = request.WarrantyPeriod ?? product.WarrantyPeriod;
                product.BatteryType = request.BatteryType ?? product.BatteryType;
                product.BatteryHealth = request.BatteryHealth ?? product.BatteryHealth;
                product.Capacity = request.Capacity ?? product.Capacity;
                product.Voltage = request.Voltage ?? product.Voltage;
                product.Bms = request.Bms ?? product.Bms;
                product.CellType = request.CellType ?? product.CellType;
                product.CycleCount = request.CycleCount ?? product.CycleCount;

                // Reset status to Re-submit if product was previously approved
                if (product.Status == "Active")
                {
                    product.Status = "Re-submit";
                    product.VerificationStatus = "NotRequested";
                }

                product.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Product {id} updated by user {userId}");

                var result = new
                {
                    id = product.ProductId,
                    productId = product.ProductId,
                    sellerId = product.SellerId,
                    title = product.Title,
                    description = product.Description,
                    price = product.Price,
                    status = product.Status,
                    verificationStatus = product.VerificationStatus,
                    productType = product.ProductType,
                    updatedAt = product.UpdatedAt,
                    message = "Sản phẩm đã được cập nhật thành công"
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating product {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật sản phẩm" });
            }
        }

        /// <summary>
        /// Cập nhật status sản phẩm (không cần authentication - dành cho admin)
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<ActionResult<object>> UpdateProductStatus(int id, [FromBody] UpdateProductStatusRequest request)
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

                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == id);

                if (product == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });
                }

                // Update status
                product.Status = request.Status;
                product.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Product {id} status updated to {request.Status}");

                return Ok(new
                {
                    productId = product.ProductId,
                    title = product.Title,
                    status = product.Status,
                    updatedAt = product.UpdatedAt,
                    message = "Trạng thái sản phẩm đã được cập nhật thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating product {id} status");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật trạng thái sản phẩm" });
            }
        }

    }

    // DTOs
    public class CreateProductRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? ProductType { get; set; }
        public string? VehicleType { get; set; }
        public int? ManufactureYear { get; set; }
        public int? Mileage { get; set; }
        public string? LicensePlate { get; set; }
        public string? WarrantyPeriod { get; set; }
        public string? BatteryType { get; set; }
        public string? BatteryHealth { get; set; }
        public string? Capacity { get; set; }
        public string? Voltage { get; set; }
        public string? Bms { get; set; }
        public string? CellType { get; set; }
        public int? CycleCount { get; set; }
    }

    public class UpdateProductRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public string? ProductType { get; set; }
        public string? VehicleType { get; set; }
        public int? ManufactureYear { get; set; }
        public int? Mileage { get; set; }
        public string? LicensePlate { get; set; }
        public string? WarrantyPeriod { get; set; }
        public string? BatteryType { get; set; }
        public string? BatteryHealth { get; set; }
        public string? Capacity { get; set; }
        public string? Voltage { get; set; }
        public string? Bms { get; set; }
        public string? CellType { get; set; }
        public int? CycleCount { get; set; }
    }

    public class RejectProductRequest
    {
        public string RejectionReason { get; set; } = string.Empty;
    }

    public class UpdateProductStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}