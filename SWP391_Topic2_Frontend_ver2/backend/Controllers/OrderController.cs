using EVTB_Backend.Data;
using EVTB_Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

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

                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
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
                _logger.LogError(ex, $"Error creating order for user {request.UserId}, product {request.ProductId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo đơn hàng" });
            }
        }

        /// <summary>
        /// Lấy danh sách orders của user
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

                var orders = await _context.Orders
                    .Where(o => o.UserId == userId)
                    .Select(o => new
                    {
                        orderId = o.OrderId,
                        userId = o.UserId,
                        productId = o.ProductId,
                        orderStatus = o.OrderStatus,
                        depositAmount = o.DepositAmount,
                        totalAmount = o.TotalAmount,
                        createdAt = o.CreatedAt,
                        updatedAt = o.UpdatedAt
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
}
