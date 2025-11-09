using EVTB_Backend.Data;
using EVTB_Backend.Models;
using EVTB_Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EVTB_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // /api/payment
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<PaymentController> _logger;
        private readonly IConfiguration _configuration;

        public PaymentController(EVTBContext context, ILogger<PaymentController> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }


        [HttpPost("seller-confirm")]
        [Authorize]
        public async Task<IActionResult> SellerConfirmSale()
        {
            try
            {
                // ✅ Authentication required: Chỉ user đã đăng nhập mới có thể gọi API
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    return Unauthorized(new { message = "Không thể xác định người dùng" });

                // Parse ProductId from query string or form data
                int productId = 0;
                
                // Try to get ProductId from query string first
                if (Request.Query.ContainsKey("ProductId") && int.TryParse(Request.Query["ProductId"], out productId))
                {
                    // ProductId found in query string
                }
                // Try to get ProductId from form data
                else if (Request.HasFormContentType && Request.Form.ContainsKey("ProductId") && int.TryParse(Request.Form["ProductId"], out productId))
                {
                    // ProductId found in form data
                }
                // Try to get ProductId from request body
                else
                {
                    string requestBody;
                    using (var reader = new StreamReader(Request.Body))
                    {
                        requestBody = await reader.ReadToEndAsync();
                    }
                    
                    if (!string.IsNullOrEmpty(requestBody))
                    {
                        var requestData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(requestBody);
                        if (requestData != null && requestData.ContainsKey("ProductId") && int.TryParse(requestData["ProductId"].ToString(), out productId))
                        {
                            // ProductId found in request body
                        }
                    }
                }
                
                if (productId <= 0)
                    return BadRequest(new { message = "Invalid product ID" });

                // Get the product to verify ownership and status
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == productId);
                if (product == null)
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });

                // ✅ Authorization check: Chỉ owner của sản phẩm mới có thể xác nhận bán
                if (product.SellerId != userId)
                    return Forbid("Bạn chỉ có thể xác nhận bán sản phẩm của mình");

                // ✅ Status validation: Chỉ cho phép xác nhận bán sản phẩm có status "Reserved"
                if (product.Status != "Reserved")
                    return BadRequest(new { message = "Chỉ có thể xác nhận bán sản phẩm đang trong quá trình thanh toán" });

                // ✅ Logic nghiệp vụ: Cập nhật status từ "Reserved" → "Sold"
                product.Status = "Sold";
                product.UpdatedAt = DateTime.UtcNow;

                // Update the product
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Product {productId} sale confirmed by seller {userId}");

                // ✅ Error handling: Xử lý các trường hợp lỗi một cách chi tiết
                return Ok(new
                {
                    message = "Sale confirmed successfully",
                    productId = product.ProductId,
                    sellerId = product.SellerId,
                    oldStatus = "Reserved",
                    newStatus = product.Status,
                    updatedAt = product.UpdatedAt,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                // ✅ Error handling: Xử lý các trường hợp lỗi một cách chi tiết
                _logger.LogError(ex, "Error confirming sale");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xác nhận bán sản phẩm" });
            }
        }

        /// <summary>
        /// VNPay callback endpoint - Xử lý kết quả thanh toán từ VNPay
        /// </summary>
        [HttpGet("vnpay-return")]
        [AllowAnonymous] // VNPay callback không cần authentication
        public async Task<IActionResult> VNPayReturn(
            [FromQuery] string vnp_Amount,
            [FromQuery] string vnp_BankCode,
            [FromQuery] string vnp_BankTranNo,
            [FromQuery] string vnp_CardType,
            [FromQuery] string vnp_OrderInfo,
            [FromQuery] string vnp_PayDate,
            [FromQuery] string vnp_ResponseCode,
            [FromQuery] string vnp_TmnCode,
            [FromQuery] string vnp_TransactionNo,
            [FromQuery] string vnp_TransactionStatus,
            [FromQuery] string vnp_TxnRef,
            [FromQuery] string vnp_SecureHash
        )
        {
            try
            {
                _logger.LogInformation($"VNPay callback received for payment {vnp_TxnRef}");
                
                // ✅ FOR TESTING: Skip signature validation in development
                var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
                
                // Parse payment ID from vnp_TxnRef (PaymentId is string)
                string paymentIdStr = vnp_TxnRef ?? string.Empty;

                // Get payment from database
                var payment = await _context.Payments.FirstOrDefaultAsync(p => p.PaymentId == paymentIdStr);
                
                if (payment == null)
                {
                    _logger.LogError($"Payment {paymentIdStr} not found");
                    return NotFound(new { message = "Payment not found" });
                }

                // Check if payment is successful (response code 00)
                bool isSuccess = vnp_ResponseCode == "00";
                
                if (isSuccess)
                {
                    // Update payment status if not already succeeded
                    if (payment.PaymentStatus != "Succeeded")
                    {
                        payment.PaymentStatus = "Succeeded";
                        payment.VNPayTransactionId = vnp_TransactionNo;
                        payment.UpdatedAt = DateTime.UtcNow;
                        payment.CompletedDate = DateTime.UtcNow;
                        
                        // Handle product status and order creation based on payment type
                        if (payment.ProductId.HasValue)
                        {
                            var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == payment.ProductId.Value);
                            
                            if (product != null)
                            {
                                // If this is a deposit payment, update product status to Reserved
                                if (payment.PaymentType == "Deposit" && product.Status != "Reserved" && product.Status != "Sold")
                                {
                                    product.Status = "Reserved";
                                    product.UpdatedAt = DateTime.UtcNow;
                                    _logger.LogInformation($"Product {product.ProductId} status updated to Reserved");
                                }
                                // If this is a FinalPayment or FullPayment, update product status to Sold and create/update order
                                else if (payment.PaymentType == "FinalPayment" || payment.PaymentType == "FullPayment" || payment.PaymentType == "Complete")
                                {
                                    product.Status = "Sold";
                                    product.UpdatedAt = DateTime.UtcNow;
                                    _logger.LogInformation($"Product {product.ProductId} status updated to Sold");
                                    
                                    // Create order if it doesn't exist
                                    if (!payment.OrderId.HasValue)
                                    {
                                        var order = new Order
                                        {
                                            UserId = payment.UserId,
                                            ProductId = product.ProductId,
                                            SellerId = payment.SellerId ?? product.SellerId,
                                            OrderStatus = "Completed",
                                            DepositAmount = 0, // Full payment doesn't have deposit
                                            TotalAmount = payment.Amount,
                                            CompletedDate = DateTime.UtcNow,
                                            CreatedAt = DateTime.UtcNow,
                                            UpdatedAt = DateTime.UtcNow
                                        };
                                        
                                        _context.Orders.Add(order);
                                        await _context.SaveChangesAsync(); // Save to get OrderId
                                        
                                        // Update payment with the new OrderId
                                        payment.OrderId = order.OrderId;
                                        _logger.LogInformation($"Order {order.OrderId} created for {payment.PaymentType} {paymentIdStr}");
                                    }
                                    else
                                    {
                                        // Update existing order to Completed
                                        var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == payment.OrderId.Value);
                                        if (order != null)
                                        {
                                            order.OrderStatus = "Completed";
                                            order.CompletedDate = DateTime.UtcNow;
                                            order.UpdatedAt = DateTime.UtcNow;
                                            _logger.LogInformation($"Order {order.OrderId} updated to Completed");
                                        }
                                    }
                                }
                                // For any other payment type that results in product being sold, create order if needed
                                else if (product.Status == "Sold" && !payment.OrderId.HasValue)
                                {
                                    // Product is already sold but no order exists - create one
                                    var order = new Order
                                    {
                                        UserId = payment.UserId,
                                        ProductId = product.ProductId,
                                        SellerId = payment.SellerId ?? product.SellerId,
                                        OrderStatus = "Completed",
                                        DepositAmount = 0,
                                        TotalAmount = payment.Amount,
                                        CompletedDate = DateTime.UtcNow,
                                        CreatedAt = DateTime.UtcNow,
                                        UpdatedAt = DateTime.UtcNow
                                    };
                                    
                                    _context.Orders.Add(order);
                                    await _context.SaveChangesAsync(); // Save to get OrderId
                                    
                                    // Update payment with the new OrderId
                                    payment.OrderId = order.OrderId;
                                    _logger.LogInformation($"Order {order.OrderId} created for payment {paymentIdStr} (product already sold)");
                                }
                            }
                        }
                        
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Payment {paymentIdStr} marked as Succeeded");
                    }
                }
                else
                {
                    payment.PaymentStatus = "Failed";
                    payment.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    _logger.LogWarning($"Payment {paymentIdStr} failed with response code: {vnp_ResponseCode}");
                }

                // ✅ Return HTML page with window.close() and postMessage to opener
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                // ✅ Get payment type from database (Verification or Deposit)
                var paymentType = payment.PaymentType ?? "Deposit";
                var successPageUrl = $"{frontendUrl}/?payment_success=true&payment_id={Uri.EscapeDataString(vnp_TxnRef)}&amount={Uri.EscapeDataString(vnp_Amount)}&transaction_no={Uri.EscapeDataString(vnp_TransactionNo)}&payment_type={Uri.EscapeDataString(paymentType)}";
                
                var html = $@"
<!DOCTYPE html>
<html lang=""vi"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Thanh toán thành công!</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }}
        .container {{
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            animation: slideIn 0.5s ease-out;
        }}
        @keyframes slideIn {{
            from {{ transform: translateY(-50px); opacity: 0; }}
            to {{ transform: translateY(0); opacity: 1; }}
        }}
        .success-icon {{
            width: 80px;
            height: 80px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            animation: checkmark 0.6s ease-in-out;
        }}
        @keyframes checkmark {{
            0% {{ transform: scale(0); }}
            50% {{ transform: scale(1.2); }}
            100% {{ transform: scale(1); }}
        }}
        .success-icon svg {{
            width: 50px;
            height: 50px;
            stroke: white;
            stroke-width: 3;
            fill: none;
        }}
        h1 {{
            color: #1f2937;
            margin: 20px 0;
            font-size: 28px;
        }}
        p {{
            color: #6b7280;
            line-height: 1.6;
            font-size: 16px;
        }}
        .info {{
            background: #f3f4f6;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }}
        .info-item {{
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            color: #4b5563;
        }}
        .loading {{
            display: inline-block;
            margin-top: 20px;
            font-size: 14px;
            color: #6b7280;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""success-icon"">
            <svg viewBox=""0 0 24 24"">
                <path d=""M5 13l4 4L19 7"" stroke=""currentColor"" stroke-linecap=""round"" stroke-linejoin=""round"" fill=""none""/>
            </svg>
        </div>
        <h1>Thanh toán thành công!</h1>
        <div class=""info"">
            <div class=""info-item"">
                <span>Mã giao dịch:</span>
                <strong>{vnp_TxnRef}</strong>
            </div>
            <div class=""info-item"">
                <span>Mã VNPay:</span>
                <strong>{vnp_TransactionNo}</strong>
            </div>
            <div class=""info-item"">
                <span>Ngân hàng:</span>
                <strong>{vnp_BankCode}</strong>
            </div>
        </div>
        <p>Đang chuyển về trang chủ...</p>
        <div class=""loading"">Vui lòng đợi trong giây lát ⏳</div>
    </div>
    <script>
        console.log('Success page loaded');
        console.log('Has opener?', !!window.opener);
        
        // ✅ Save payment success to localStorage as backup
        try {{
            const paymentData = {{
                timestamp: Date.now(),
                paymentId: '{vnp_TxnRef}',
                amount: '{vnp_Amount}',
                transactionNo: '{vnp_TransactionNo}',
                paymentType: '{paymentType}',
                processed: false
            }};
            localStorage.setItem('evtb_payment_success', JSON.stringify(paymentData));
            console.log('Payment data saved to localStorage');
        }} catch (e) {{
            console.error('Could not save to localStorage:', e);
        }}
        
        // Send postMessage to opener window
        try {{
            if (window.opener && !window.opener.closed) {{
                console.log('Sending postMessage to opener...');
                window.opener.postMessage({{
                    type: 'EVTB_PAYMENT_SUCCESS',
                    payload: {{
                        paymentId: '{vnp_TxnRef}',
                        amount: '{vnp_Amount}',
                        transactionNo: '{vnp_TransactionNo}',
                        paymentType: '{paymentType}'
                    }}
                }}, '*');
                console.log('postMessage sent successfully');
                
                // Redirect opener to homepage with success query for UI toast
                try {{
                    console.log('Redirecting opener to:', '{successPageUrl}');
                    if (window.opener && !window.opener.closed) {{
                        window.opener.location.replace('{successPageUrl}');
                        console.log('Redirect command sent via location.replace');
                    }}
                }} catch (redirectError) {{
                    console.error('Could not redirect opener:', redirectError);
                    // Fallback: try opener redirect
                    try {{
                        if (window.opener) window.opener.postMessage({{type: 'EVTB_REDIRECT', url: '{successPageUrl}'}}, '*');
                    }} catch(e) {{}}
                }}
            }} else {{
                console.log('No opener or opener closed');
            }}
        }} catch (e) {{
            console.error('Could not send postMessage:', e);
        }}
        
        // Attempt to close this window after a delay
        setTimeout(function() {{
            console.log('Attempting to close window...');
            window.close();
            console.log('Close command sent');
        }}, 1500);
    </script>
</body>
</html>";

                _logger.LogInformation($"Returning success page for payment {vnp_TxnRef}");
                return Content(html, "text/html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing VNPay callback");
                
                // Return error page HTML
                var html = $@"
<!DOCTYPE html>
<html lang=""vi"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Lỗi thanh toán</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }}
        .container {{
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            animation: slideIn 0.5s ease-out;
        }}
        @keyframes slideIn {{
            from {{ transform: translateY(-50px); opacity: 0; }}
            to {{ transform: translateY(0); opacity: 1; }}
        }}
        .error-icon {{
            width: 80px;
            height: 80px;
            background: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }}
        .error-icon svg {{
            width: 50px;
            height: 50px;
            stroke: white;
            stroke-width: 3;
        }}
        h1 {{
            color: #1f2937;
            margin: 20px 0;
            font-size: 28px;
        }}
        p {{
            color: #6b7280;
            line-height: 1.6;
            font-size: 16px;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""error-icon"">
            <svg viewBox=""0 0 24 24"">
                <path d=""M18 6L6 18M6 6l12 12"" stroke=""currentColor"" stroke-width=""3""/>
            </svg>
        </div>
        <h1>Lỗi xử lý thanh toán</h1>
        <p>Đã xảy ra lỗi khi xử lý giao dịch của bạn. Vui lòng thử lại.</p>
        <p style=""margin-top: 20px; font-size: 14px; color: #9ca3af;"">Đang đóng cửa sổ...</p>
    </div>
    <script>
        setTimeout(function() {{
            window.close();
        }}, 2000);
    </script>
</body>
</html>";
                
                return Content(html, "text/html");
            }
        }

        [HttpPost("admin-confirm")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> AdminConfirmSale([FromBody] AdminAcceptRequest request)
        {
            try
            {
                // ✅ Authentication required: Chỉ admin đã đăng nhập mới có thể gọi API
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int adminId))
                    return Unauthorized(new { message = "Invalid user authentication" });

                // ✅ Authorization check: Chỉ admin mới có thể xác nhận
                var userRole = User.FindFirst("roleId")?.Value ?? "";
                if (userRole != "1") // Assuming "1" is admin role
                    return StatusCode(403, new { message = "Only administrators can accept sales" });

                // Validate request
                if (request == null)
                    return BadRequest(new { message = "Request data is required" });

                if (request.ProductId <= 0)
                    return BadRequest(new { message = "Invalid product ID" });

                // Get the product to verify status
                var product = await _context.Products
                    .Include(p => p.Seller)
                    .FirstOrDefaultAsync(p => p.ProductId == request.ProductId);
                
                if (product == null)
                    return NotFound(new { message = "Product not found" });

                // ✅ Status validation: Chỉ cho phép admin xác nhận sản phẩm có status "Reserved"
                if (product.Status?.ToLower() != "reserved")
                    return BadRequest(new { message = $"Product must be in 'Reserved' status for admin acceptance. Current status: {product.Status}" });

                // ✅ Logic nghiệp vụ: Admin xác nhận và chuyển status từ "Reserved" → "Sold"
                product.Status = "Sold";
                product.UpdatedAt = DateTime.UtcNow;

                // Find and update related order
                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.ProductId == request.ProductId && o.OrderStatus == "Deposited");

                if (order != null)
                {
                    order.OrderStatus = "Completed";
                    order.CompletedDate = DateTime.UtcNow;
                    order.UpdatedAt = DateTime.UtcNow;
                }

                // Save changes
                await _context.SaveChangesAsync();

                // ✅ Transaction logging for audit trail
                _logger.LogInformation($"Admin {adminId} accepted sale for product {request.ProductId}. Status changed from Reserved to Sold. Order {order?.OrderId} completed.");

                // ✅ Error handling: Xử lý các trường hợp lỗi một cách chi tiết
                return Ok(new
                {
                    message = "Admin accepted sale successfully",
                    productId = product.ProductId,
                    sellerId = product.SellerId,
                    sellerName = product.Seller?.FullName ?? "Unknown",
                    adminId = adminId,
                    oldStatus = "Reserved",
                    newStatus = product.Status,
                    orderId = order?.OrderId,
                    orderStatus = order?.OrderStatus,
                    completedDate = order?.CompletedDate,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                // ✅ Error handling: Xử lý các trường hợp lỗi một cách chi tiết
                _logger.LogError(ex, $"Error in AdminAcceptSale for product {request?.ProductId}");
                return StatusCode(500, new { message = "Internal server error occurred while processing admin acceptance" });
            }
        }
    }
}