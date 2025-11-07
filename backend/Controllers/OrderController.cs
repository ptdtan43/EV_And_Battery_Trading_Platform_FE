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
    public class OrderController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<OrderController> _logger;

        public OrderController(EVTBContext context, ILogger<OrderController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Tạo order mới
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<object>> CreateOrder([FromBody] CreateOrderRequest request)
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

                // Debug JWT token information
                _logger.LogInformation("=== JWT TOKEN DEBUG ===");
                _logger.LogInformation($"User.Identity.IsAuthenticated: {User.Identity?.IsAuthenticated}");
                _logger.LogInformation($"User.Identity.Name: {User.Identity?.Name}");
                _logger.LogInformation($"User.Claims count: {User.Claims.Count()}");
                
                foreach (var claim in User.Claims)
                {
                    _logger.LogInformation($"Claim Type: {claim.Type}, Value: {claim.Value}");
                }

                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                _logger.LogInformation($"NameIdentifier claim found: {userIdClaim != null}, Value: {userIdClaim?.Value}");
                
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    _logger.LogError("Failed to extract user ID from JWT token");
                    return Unauthorized(new { message = "Không thể xác định người dùng từ token" });
                }

                _logger.LogInformation($"Creating order for user {userId}, product {request.ProductId}");

                // Get product info to find seller
                // Note: In a real scenario, you'd have a Product table with SellerId
                // For now, we'll use a mock seller ID or get it from the request
                var sellerId = request.SellerId ?? 1; // Default to admin as seller for testing

                // Calculate final payment due date (7 days from now)
                var finalPaymentDueDate = DateTime.UtcNow.AddDays(7);

                // Tạo order mới
                var order = new Order
                {
                    UserId = userId,
                    ProductId = request.ProductId,
                    SellerId = sellerId,
                    OrderStatus = "Pending",
                    DepositAmount = request.DepositAmount,
                    TotalAmount = request.TotalAmount,
                    FinalPaymentDueDate = finalPaymentDueDate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Order created successfully: {order.OrderId}");

                return Ok(new
                {
                    orderId = order.OrderId,
                    userId = order.UserId,
                    productId = order.ProductId,
                    sellerId = order.SellerId,
                    orderStatus = order.OrderStatus,
                    depositAmount = order.DepositAmount,
                    totalAmount = order.TotalAmount,
                    finalPaymentDueDate = order.FinalPaymentDueDate,
                    createdAt = order.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating order for product {request.ProductId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo đơn hàng" });
            }
        }

        /// <summary>
        /// Lấy danh sách orders của buyer (người mua)
        /// </summary>
        [HttpGet("buyer")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetBuyerOrders()
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var orders = await _context.Orders
                    .Include(o => o.Product)
                    .Include(o => o.Seller)
                    .Include(o => o.User)
                    .Where(o => o.UserId == userId)
                    .Select(o => new
                    {
                        orderId = o.OrderId,
                        productId = o.ProductId,
                        productTitle = o.Product?.Title ?? "Unknown",
                        productImages = new string[0], // Empty array instead of null
                        sellerId = o.SellerId ?? 0,
                        sellerName = o.Seller?.FullName ?? "Unknown",
                        sellerEmail = o.Seller?.Email ?? "Unknown",
                        sellerPhone = o.Seller?.Phone ?? "Unknown",
                        depositAmount = o.DepositAmount,
                        totalAmount = o.TotalAmount,
                        orderStatus = o.OrderStatus,
                        completedDate = o.CompletedDate ?? DateTime.MinValue,
                        createdAt = o.CreatedAt,
                        sellerConfirmed = o.SellerConfirmed,
                        sellerConfirmedDate = o.SellerConfirmedDate ?? DateTime.MinValue,
                        adminConfirmed = o.AdminConfirmed,
                        adminConfirmedDate = o.AdminConfirmedDate ?? DateTime.MinValue,
                        hasRating = _context.Ratings.Any(r => r.OrderId == o.OrderId)
                    })
                    .OrderByDescending(o => o.createdAt)
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting buyer orders for user {userIdClaim?.Value}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách đơn hàng của người mua" });
            }
        }

        /// <summary>
        /// Lấy danh sách orders của user (hoặc tất cả orders nếu là admin)
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetUserOrders()
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Check if user is admin
                var user = await _context.Users.FindAsync(userId);
                bool isAdmin = user != null && user.RoleId == 1;

                var query = _context.Orders.AsQueryable();
                
                // If not admin, only return user's orders
                if (!isAdmin)
                {
                    query = query.Where(o => o.UserId == userId);
                }

                var orders = await query
                    .Select(o => new
                    {
                        orderId = o.OrderId,
                        userId = o.UserId,
                        productId = o.ProductId,
                        orderStatus = o.OrderStatus,
                        depositAmount = o.DepositAmount,
                        totalAmount = o.TotalAmount,
                        createdAt = o.CreatedAt,
                        updatedAt = o.UpdatedAt,
                        adminNotes = o.AdminNotes,
                        refundOption = o.RefundOption,
                        cancellationReason = o.AdminNotes // For backward compatibility
                    })
                    .OrderByDescending(o => o.createdAt)
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user orders");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách đơn hàng" });
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng đã hoàn thành của user
        /// </summary>
        [HttpGet("user/{userId}/completed")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetUserCompletedOrders(int userId)
        {
            try
            {
                // Get current user ID from JWT token
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Check if user is admin or requesting their own orders
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == currentUserId);
                if (user == null || (user.RoleId != 1 && currentUserId != userId))
                {
                    return Forbid("Bạn chỉ có thể xem đơn hàng của mình");
                }

                var orders = await _context.Orders
                    .Include(o => o.Product)
                    .Include(o => o.Seller)
                    .Include(o => o.User)
                    .Where(o => o.UserId == userId && o.OrderStatus == "completed")
                    .Select(o => new
                    {
                        orderId = o.OrderId,
                        productId = o.ProductId,
                        productTitle = o.Product?.Title ?? "Unknown",
                        productImages = new string[0], // Empty array instead of null
                        sellerId = o.SellerId ?? 0,
                        sellerName = o.Seller?.FullName ?? "Unknown",
                        sellerEmail = o.Seller?.Email ?? "Unknown",
                        sellerPhone = o.Seller?.Phone ?? "Unknown",
                        depositAmount = o.DepositAmount,
                        totalAmount = o.TotalAmount,
                        completedDate = o.CompletedDate ?? DateTime.MinValue,
                        createdAt = o.CreatedAt,
                        hasRating = _context.Ratings.Any(r => r.OrderId == o.OrderId)
                    })
                    .OrderByDescending(o => o.completedDate)
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting completed orders for user {userId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách đơn hàng đã hoàn thành" });
            }
        }

        /// <summary>
        /// Lấy thông tin order theo ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> GetOrder(int id)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.OrderId == id && o.UserId == userId);

                if (order == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn hàng" });
                }

                return Ok(new
                {
                    orderId = order.OrderId,
                    userId = order.UserId,
                    productId = order.ProductId,
                    orderStatus = order.OrderStatus,
                    depositAmount = order.DepositAmount,
                    totalAmount = order.TotalAmount,
                    createdAt = order.CreatedAt,
                    updatedAt = order.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting order {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin đơn hàng" });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái order
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> UpdateOrder(int id, [FromBody] UpdateOrderRequest request)
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

                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.OrderId == id && o.UserId == userId);

                if (order == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn hàng" });
                }

                // Cập nhật thông tin
                order.OrderStatus = request.OrderStatus ?? order.OrderStatus;
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Order {id} updated successfully");

                return Ok(new
                {
                    orderId = order.OrderId,
                    userId = order.UserId,
                    productId = order.ProductId,
                    orderStatus = order.OrderStatus,
                    depositAmount = order.DepositAmount,
                    totalAmount = order.TotalAmount,
                    updatedAt = order.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating order {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật đơn hàng" });
            }
        }

        /// <summary>
        /// Seller confirms transaction completion
        /// </summary>
        [HttpPost("{id}/seller-confirm")]
        [Authorize]
        public async Task<ActionResult<object>> SellerConfirmTransaction(int id)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var order = await _context.Orders
                    .Include(o => o.Product)
                    .FirstOrDefaultAsync(o => o.OrderId == id && o.SellerId == userId);

                if (order == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn hàng hoặc bạn không có quyền xác nhận" });
                }

                if (order.OrderStatus != "DepositPaid")
                {
                    return BadRequest(new { message = "Chỉ có thể xác nhận giao dịch khi đã thanh toán cọc" });
                }

                // Update seller confirmation
                order.SellerConfirmed = true;
                order.SellerConfirmedDate = DateTime.UtcNow;
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Order {id} confirmed by seller {userId}");

                return Ok(new
                {
                    message = "Xác nhận giao dịch thành công",
                    orderId = order.OrderId,
                    sellerConfirmed = order.SellerConfirmed,
                    sellerConfirmedDate = order.SellerConfirmedDate,
                    nextStep = "Chờ admin duyệt để hoàn tất giao dịch"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error confirming transaction for order {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xác nhận giao dịch" });
            }
        }

        /// <summary>
        /// Admin confirms transaction completion
        /// </summary>
        [HttpPost("{id}/admin-confirm")]
        [Authorize]
        public async Task<ActionResult<object>> AdminConfirmTransaction(int id, [FromBody] AdminConfirmRequest request)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Check if user is admin (roleId = 1)
                var user = await _context.Users.FindAsync(userId);
                if (user == null || user.RoleId != 1)
                {
                    return Forbid("Chỉ admin mới có quyền xác nhận giao dịch");
                }

                var order = await _context.Orders
                    .Include(o => o.Product)
                    .Include(o => o.User)
                    .Include(o => o.Seller)
                    .FirstOrDefaultAsync(o => o.OrderId == id);

                if (order == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn hàng" });
                }

                if (!order.SellerConfirmed)
                {
                    return BadRequest(new { message = "Seller chưa xác nhận giao dịch" });
                }

                // Update admin confirmation
                order.AdminConfirmed = true;
                order.AdminConfirmedDate = DateTime.UtcNow;
                order.AdminNotes = request.AdminNotes;
                order.OrderStatus = "Completed";
                order.CompletedDate = DateTime.UtcNow;
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Order {id} confirmed by admin {userId}");

                return Ok(new
                {
                    message = "Admin đã xác nhận giao dịch thành công",
                    orderId = order.OrderId,
                    adminConfirmed = order.AdminConfirmed,
                    adminConfirmedDate = order.AdminConfirmedDate,
                    orderStatus = order.OrderStatus,
                    completedDate = order.CompletedDate
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error admin confirming transaction for order {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi admin xác nhận giao dịch" });
            }
        }

        /// <summary>
        /// Get orders waiting for seller confirmation
        /// </summary>
        [HttpGet("seller-pending")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetSellerPendingOrders()
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var orders = await _context.Orders
                    .Include(o => o.Product)
                    .Include(o => o.User)
                    .Where(o => o.SellerId == userId && o.OrderStatus == "DepositPaid" && !o.SellerConfirmed)
                    .Select(o => new
                    {
                        orderId = o.OrderId,
                        productId = o.ProductId,
                        productTitle = o.Product?.Title ?? "Unknown",
                        buyerName = o.User?.FullName ?? "Unknown",
                        buyerEmail = o.User?.Email ?? "Unknown",
                        buyerPhone = o.User?.Phone ?? "Unknown",
                        depositAmount = o.DepositAmount,
                        totalAmount = o.TotalAmount,
                        createdAt = o.CreatedAt,
                        sellerConfirmed = o.SellerConfirmed,
                        sellerConfirmedDate = o.SellerConfirmedDate ?? DateTime.MinValue
                    })
                    .OrderByDescending(o => o.createdAt)
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting seller pending orders");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách đơn hàng chờ xác nhận" });
            }
        }

        /// <summary>
        /// Admin rejects/cancels transaction
        /// </summary>
        [HttpPost("{id}/admin-reject")]
        [Authorize]
        public async Task<ActionResult<object>> AdminRejectTransaction(int id, [FromBody] AdminRejectRequest request)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Check if user is admin (roleId = 1)
                var user = await _context.Users.FindAsync(userId);
                if (user == null || user.RoleId != 1)
                {
                    return Forbid("Chỉ admin mới có quyền hủy giao dịch");
                }

                var order = await _context.Orders
                    .Include(o => o.Product)
                    .Include(o => o.User)
                    .Include(o => o.Seller)
                    .FirstOrDefaultAsync(o => o.OrderId == id);

                if (order == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn hàng" });
                }

                // Validate reason
                if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Length < 3)
                {
                    return BadRequest(new { message = "Lý do hủy phải có ít nhất 3 ký tự" });
                }

                // Update order status
                order.OrderStatus = "Cancelled";
                order.AdminNotes = request.Reason;
                order.RefundOption = request.RefundOption;
                order.UpdatedAt = DateTime.UtcNow;

                // Update product status back to Active
                if (order.Product != null)
                {
                    order.Product.Status = "Active";
                    order.Product.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Order {id} rejected by admin {userId}. Reason: {request.Reason}, Refund: {request.RefundOption}");

                // Prepare response
                var response = new
                {
                    message = "Đã hủy giao dịch thành công",
                    orderId = order.OrderId,
                    productId = order.ProductId,
                    buyerId = order.UserId,
                    sellerId = order.SellerId,
                    orderStatus = order.OrderStatus,
                    reason = request.Reason,
                    refundOption = request.RefundOption,
                    refundAmount = request.RefundOption == "refund" ? order.DepositAmount : 0,
                    cancelledAt = DateTime.UtcNow
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error admin rejecting transaction for order {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi hủy giao dịch" });
            }
        }

        /// <summary>
        /// Get orders waiting for admin confirmation
        /// </summary>
        [HttpGet("admin-pending")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetAdminPendingOrders()
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Check if user is admin (roleId = 1)
                var user = await _context.Users.FindAsync(userId);
                if (user == null || user.RoleId != 1)
                {
                    return Forbid("Chỉ admin mới có quyền xem danh sách này");
                }

                var orders = await _context.Orders
                    .Include(o => o.Product)
                    .Include(o => o.User)
                    .Include(o => o.Seller)
                    .Where(o => o.SellerConfirmed && !o.AdminConfirmed)
                    .Select(o => new
                    {
                        orderId = o.OrderId,
                        productId = o.ProductId,
                        productTitle = o.Product?.Title ?? "Unknown",
                        buyerName = o.User?.FullName ?? "Unknown",
                        buyerEmail = o.User?.Email ?? "Unknown",
                        buyerPhone = o.User?.Phone ?? "Unknown",
                        sellerName = o.Seller?.FullName ?? "Unknown",
                        sellerEmail = o.Seller?.Email ?? "Unknown",
                        sellerPhone = o.Seller?.Phone ?? "Unknown",
                        depositAmount = o.DepositAmount,
                        totalAmount = o.TotalAmount,
                        createdAt = o.CreatedAt,
                        sellerConfirmed = o.SellerConfirmed,
                        sellerConfirmedDate = o.SellerConfirmedDate ?? DateTime.MinValue,
                        adminConfirmed = o.AdminConfirmed,
                        adminConfirmedDate = o.AdminConfirmedDate ?? DateTime.MinValue
                    })
                    .OrderByDescending(o => o.sellerConfirmedDate)
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting admin pending orders");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách đơn hàng chờ admin duyệt" });
            }
        }
        /// <summary>
        /// Lấy danh sách đơn hàng đã hoàn tất của user
        /// </summary>
        [HttpGet("user/{userId}/completed")]
        [Authorize]
        public async Task<ActionResult<object>> GetUserCompletedOrders(int userId)
        {
            try
            {
                // Verify user can access their own orders
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                if (currentUserId != userId)
                {
                    return Forbid("Bạn chỉ có thể xem đơn hàng của mình");
                }

                var orders = await _context.Orders
                    .Include(o => o.Product)
                    .Include(o => o.Seller)
                    .Include(o => o.User)
                    .Where(o => o.UserId == userId && o.OrderStatus == "completed")
                    .Select(o => new
                    {
                        orderId = o.OrderId,
                        productId = o.ProductId,
                        productTitle = o.Product?.Title ?? "Unknown",
                        productImages = new string[0], // Empty array instead of null
                        sellerId = o.SellerId ?? 0,
                        sellerName = o.Seller?.FullName ?? "Unknown",
                        sellerEmail = o.Seller?.Email ?? "Unknown",
                        sellerPhone = o.Seller?.Phone ?? "Unknown",
                        depositAmount = o.DepositAmount,
                        totalAmount = o.TotalAmount,
                        completedDate = o.CompletedDate ?? DateTime.MinValue,
                        createdAt = o.CreatedAt,
                        hasRating = _context.Ratings.Any(r => r.OrderId == o.OrderId)
                    })
                    .OrderByDescending(o => o.completedDate)
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user completed orders");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách đơn hàng đã hoàn tất" });
            }
        }
    }

    // DTOs
    public class CreateOrderRequest
    {
        public int ProductId { get; set; }
        public int? SellerId { get; set; }
        public decimal DepositAmount { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class UpdateOrderRequest
    {
        public string? OrderStatus { get; set; }
    }

    public class AdminRejectRequest
    {
        public string Reason { get; set; } = string.Empty;
        public string RefundOption { get; set; } = "refund"; // "refund" or "no_refund"
    }

    public class AdminConfirmRequest
    {
        public string? AdminNotes { get; set; }
    }
}
