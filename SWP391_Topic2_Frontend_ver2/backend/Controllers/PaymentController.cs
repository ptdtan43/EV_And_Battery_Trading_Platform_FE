using EVTB_Backend.Data;
using EVTB_Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text;

namespace EVTB_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

        /// <summary>
        /// Tạo payment request cho VNPay
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<object>> CreatePayment([FromBody] CreatePaymentRequest request)
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

                _logger.LogInformation($"Creating payment for user {userId}, order {request.OrderId}, amount {request.Amount}");

                // ✅ VNPay validation: Amount must be between 5,000 and 999,999,999 VND
                const decimal VNPAY_MIN_AMOUNT = 5000m;
                const decimal VNPAY_MAX_AMOUNT = 999999999m; // Under 1 billion
                
                if (request.Amount < VNPAY_MIN_AMOUNT)
                {
                    _logger.LogWarning($"Payment amount {request.Amount} is below VNPay minimum {VNPAY_MIN_AMOUNT}");
                    return BadRequest(new { message = $"Số tiền thanh toán phải tối thiểu {VNPAY_MIN_AMOUNT:N0} VND" });
                }
                
                if (request.Amount > VNPAY_MAX_AMOUNT)
                {
                    _logger.LogWarning($"Payment amount {request.Amount} exceeds VNPay maximum {VNPAY_MAX_AMOUNT}");
                    return BadRequest(new { message = $"Số tiền thanh toán không được vượt quá {VNPAY_MAX_AMOUNT:N0} VND. Vui lòng liên hệ admin để xử lý." });
                }

                // Validate order exists and belongs to user
                Order? order = null;
                if (request.OrderId.HasValue)
                {
                    order = await _context.Orders
                        .FirstOrDefaultAsync(o => o.OrderId == request.OrderId.Value && o.UserId == userId);

                    if (order == null)
                    {
                        return BadRequest(new { message = "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập" });
                    }
                }

                // Calculate payout amount (95% of payment amount, 5% platform fee)
                var platformFeeRate = 0.05m; // 5% platform fee
                var payoutAmount = request.Amount * (1 - platformFeeRate);

                // Generate payment ID
                var paymentId = GeneratePaymentId();

                // Create VNPay URL
                var paymentUrl = CreateVNPayUrl(paymentId, request.Amount, request.OrderId);

                // Save payment record
                var payment = new Payment
                {
                    PaymentId = paymentId,
                    UserId = userId,
                    OrderId = request.OrderId,
                    ProductId = order?.ProductId ?? request.ProductId,
                    SellerId = order?.SellerId,
                    Amount = request.Amount,
                    PayoutAmount = payoutAmount,
                    PaymentType = request.PaymentType,
                    PaymentStatus = "Pending",
                    PaymentUrl = paymentUrl,
                    FinalPaymentDueDate = order?.FinalPaymentDueDate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Payment created successfully: {paymentId}");

                return Ok(new
                {
                    paymentId = payment.PaymentId,
                    paymentUrl = payment.PaymentUrl,
                    amount = payment.Amount,
                    payoutAmount = payment.PayoutAmount,
                    paymentType = payment.PaymentType,
                    orderId = payment.OrderId,
                    productId = payment.ProductId,
                    sellerId = payment.SellerId,
                    finalPaymentDueDate = payment.FinalPaymentDueDate
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating payment for order {request.OrderId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo thanh toán" });
            }
        }

        /// <summary>
        /// Tạo payment test để test callback
        /// </summary>
        [HttpPost("create-test-payment")]
        public async Task<ActionResult<object>> CreateTestPayment([FromBody] CreateTestPaymentRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                _logger.LogInformation($"Creating test payment: {request.PaymentId}");

                // Tạo payment mới
                var payment = new Payment
                {
                    PaymentId = request.PaymentId,
                    UserId = userId,
                    OrderId = request.OrderId,
                    ProductId = request.ProductId,
                    SellerId = request.SellerId,
                    Amount = request.Amount,
                    PayoutAmount = request.Amount * 0.95m, // 95% payout
                    PaymentType = request.PaymentType,
                    PaymentStatus = "Pending",
                    FinalPaymentDueDate = DateTime.UtcNow.AddDays(7),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Test payment created successfully: {payment.PaymentId}");

                return Ok(new
                {
                    paymentId = payment.PaymentId,
                    userId = payment.UserId,
                    orderId = payment.OrderId,
                    productId = payment.ProductId,
                    sellerId = payment.SellerId,
                    amount = payment.Amount,
                    payoutAmount = payment.PayoutAmount,
                    paymentType = payment.PaymentType,
                    paymentStatus = payment.PaymentStatus,
                    finalPaymentDueDate = payment.FinalPaymentDueDate,
                    createdAt = payment.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating test payment: {request.PaymentId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo test payment" });
            }
        }

        /// <summary>
        /// Test endpoint để debug VNPay callback
        /// </summary>
        [HttpGet("test-callback")]
        public ActionResult TestCallback([FromQuery] string vnp_TxnRef = "20", [FromQuery] string vnp_ResponseCode = "00", [FromQuery] string vnp_Amount = "1000000000", [FromQuery] string vnp_TransactionNo = "15208588")
        {
            try
            {
                _logger.LogInformation($"Test callback received: {vnp_TxnRef}");
                
                // Redirect to frontend HomePage with success notification
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                var redirectUrl = $"{frontendUrl}/?payment_success=true&payment_id={vnp_TxnRef}&amount={vnp_Amount}&transaction_no={vnp_TransactionNo}";
                
                return Redirect(redirectUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in test callback: {vnp_TxnRef}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi test callback", error = ex.Message });
            }
        }

        /// <summary>
        /// Xử lý callback từ VNPay (endpoint cũ)
        /// </summary>
        [HttpGet("vnpay-return")]
        public async Task<ActionResult> VNPayReturn([FromQuery] VNPayCallbackRequest request)
        {
            try
            {
                _logger.LogInformation($"VNPay return received: {request.vnp_TxnRef}");
                
                // Redirect to callback endpoint
                return await PaymentCallback(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in VNPay return: {request.vnp_TxnRef}");
                
                // Even on error, redirect to frontend with error message
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                var errorRedirectUrl = $"{frontendUrl}/?payment_error=true&payment_id={request.vnp_TxnRef}";
                
                return Redirect(errorRedirectUrl);
            }
        }

        /// <summary>
        /// Xử lý callback từ VNPay
        /// </summary>
        [HttpGet("callback")]
        public async Task<ActionResult> PaymentCallback([FromQuery] VNPayCallbackRequest request)
        {
            try
            {
                _logger.LogInformation($"Payment callback received: {request.vnp_TxnRef}");

                // Find payment by payment ID
                var payment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.PaymentId == request.vnp_TxnRef);

                if (payment == null)
                {
                    _logger.LogWarning($"Payment not found: {request.vnp_TxnRef}, creating new payment");
                    
                    // Auto-create payment if not exists (for VNPay callback)
                    payment = new Payment
                    {
                        PaymentId = request.vnp_TxnRef,
                        UserId = 1, // Default to admin user
                        OrderId = null,
                        ProductId = null,
                        SellerId = 1, // Default to admin seller
                        Amount = !string.IsNullOrEmpty(request.vnp_Amount) && long.TryParse(request.vnp_Amount, out long amountLong) ? amountLong / 100m : 0,
                        PayoutAmount = !string.IsNullOrEmpty(request.vnp_Amount) && long.TryParse(request.vnp_Amount, out long payoutAmountLong) ? (payoutAmountLong / 100m) * 0.95m : 0,
                        PaymentType = "Deposit",
                        PaymentStatus = "Pending",
                        FinalPaymentDueDate = DateTime.UtcNow.AddDays(7),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Payments.Add(payment);
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"Auto-created payment: {payment.PaymentId}");
                }

                // Check if payment is already successful
                if (payment.PaymentStatus == "Success")
                {
                    _logger.LogInformation($"Payment {request.vnp_TxnRef} already succeeded, redirecting to frontend");
                    
                    // Redirect to frontend HomePage with success notification
                    var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                    var successRedirectUrl = $"{frontendUrl}/?payment_success=true&payment_id={request.vnp_TxnRef}&amount={request.vnp_Amount}&transaction_no={request.vnp_TransactionNo}";
                    
                    return Redirect(successRedirectUrl);
                }

                // Update payment status
                var isSuccess = request.vnp_ResponseCode == "00";
                payment.PaymentStatus = isSuccess ? "Success" : "Failed";
                payment.VNPayTransactionId = request.vnp_TransactionNo;
                payment.VNPayResponseCode = request.vnp_ResponseCode;
                payment.VNPayMessage = request.vnp_ResponseMessage;
                payment.UpdatedAt = DateTime.UtcNow;

                // Set completed date if payment is successful
                if (isSuccess)
                {
                    payment.CompletedDate = DateTime.UtcNow;
                }

                // Update order status if payment is successful
                if (isSuccess && payment.OrderId.HasValue)
                {
                    var order = await _context.Orders
                        .FirstOrDefaultAsync(o => o.OrderId == payment.OrderId.Value);

                    if (order != null)
                    {
                        order.OrderStatus = payment.PaymentType == "Deposit" ? "DepositPaid" : "Paid";
                        order.UpdatedAt = DateTime.UtcNow;
                        
                        // Set order completed date if final payment
                        if (payment.PaymentType == "FinalPayment")
                        {
                            order.CompletedDate = DateTime.UtcNow;
                        }
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Payment callback processed: {payment.PaymentId}, Status: {payment.PaymentStatus}");

                // Redirect to frontend HomePage with success notification
                var finalFrontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                var finalRedirectUrl = $"{finalFrontendUrl}/?payment_success=true&payment_id={request.vnp_TxnRef}&amount={request.vnp_Amount}&transaction_no={request.vnp_TransactionNo}";
                
                return Redirect(finalRedirectUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing payment callback: {request.vnp_TxnRef}");
                
                // Even on error, redirect to frontend with error message
                var errorFrontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                var errorRedirectUrl = $"{errorFrontendUrl}/?payment_error=true&payment_id={request.vnp_TxnRef}";
                
                return Redirect(errorRedirectUrl);
            }
        }

        /// <summary>
        /// Lấy thông tin payment theo ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> GetPayment(int id)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var payment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.PaymentId == id.ToString() && p.UserId == userId);

                if (payment == null)
                {
                    return NotFound(new { message = "Không tìm thấy giao dịch" });
                }

                return Ok(new
                {
                    paymentId = payment.PaymentId,
                    userId = payment.UserId,
                    orderId = payment.OrderId,
                    productId = payment.ProductId,
                    sellerId = payment.SellerId,
                    amount = payment.Amount,
                    payoutAmount = payment.PayoutAmount,
                    paymentType = payment.PaymentType,
                    paymentStatus = payment.PaymentStatus,
                    vnpayTransactionId = payment.VNPayTransactionId,
                    vnpayResponseCode = payment.VNPayResponseCode,
                    vnpayMessage = payment.VNPayMessage,
                    finalPaymentDueDate = payment.FinalPaymentDueDate,
                    completedDate = payment.CompletedDate,
                    createdAt = payment.CreatedAt,
                    updatedAt = payment.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting payment {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin giao dịch" });
            }
        }

        private string GeneratePaymentId()
        {
            // Generate unique payment ID
            return $"PAY{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}";
        }

        private string CreateVNPayUrl(string paymentId, decimal amount, int? orderId)
        {
            // VNPay configuration
            var vnpayUrl = _configuration["VNPay:Url"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
            var vnpayTmnCode = _configuration["VNPay:TmnCode"] ?? "2QXUI4J4";
            var vnpayHashSecret = _configuration["VNPay:HashSecret"] ?? "RAOEXHYVSDDIIENYWSLDKIENWSIEIY";
            var returnUrl = _configuration["VNPay:ReturnUrl"] ?? "http://localhost:5173/payment-result";

            // ✅ VNPay validation: Ensure amount is within valid range before converting
            const decimal VNPAY_MIN_AMOUNT = 5000m;
            const decimal VNPAY_MAX_AMOUNT = 999999999m;
            
            if (amount < VNPAY_MIN_AMOUNT || amount > VNPAY_MAX_AMOUNT)
            {
                _logger.LogError($"Invalid amount for VNPay: {amount}. Must be between {VNPAY_MIN_AMOUNT} and {VNPAY_MAX_AMOUNT}");
                throw new ArgumentException($"Số tiền {amount:N0} VND không hợp lệ. VNPay chỉ chấp nhận từ {VNPAY_MIN_AMOUNT:N0} đến {VNPAY_MAX_AMOUNT:N0} VND");
            }

            // Convert amount to cents (VNPay requires amount in cents)
            // VNPay: amount in VND * 100 = amount in cents
            var amountInCents = (long)(amount * 100);
            
            // ✅ Additional validation: Check if amount in cents is within reasonable range
            // VNPay may have limits on the cents value as well
            const long MAX_CENTS = 99999999999L; // 999,999,999,999 cents = ~10 billion VND (safety limit)
            if (amountInCents > MAX_CENTS)
            {
                _logger.LogError($"Amount in cents {amountInCents} exceeds maximum {MAX_CENTS}");
                throw new ArgumentException($"Số tiền quá lớn để xử lý. Vui lòng liên hệ admin.");
            }
            
            _logger.LogInformation($"Creating VNPay URL: PaymentId={paymentId}, Amount={amount:N0} VND, AmountInCents={amountInCents:N0}");

            // Create VNPay parameters
            var vnpParams = new Dictionary<string, string>
            {
                {"vnp_Version", "2.1.0"},
                {"vnp_Command", "pay"},
                {"vnp_TmnCode", vnpayTmnCode},
                {"vnp_Amount", amountInCents.ToString()}, // Amount in cents
                {"vnp_CreateDate", DateTime.UtcNow.ToString("yyyyMMddHHmmss")},
                {"vnp_CurrCode", "VND"},
                {"vnp_IpAddr", GetClientIpAddress()},
                {"vnp_Locale", "vn"},
                {"vnp_OrderInfo", $"Thanh toan don hang {orderId ?? 0}"},
                {"vnp_OrderType", "other"},
                {"vnp_ReturnUrl", returnUrl},
                {"vnp_TxnRef", paymentId}
            };

            // Sort parameters and create query string
            var sortedParams = vnpParams.OrderBy(x => x.Key).ToDictionary(x => x.Key, x => x.Value);
            var queryString = string.Join("&", sortedParams.Select(x => $"{x.Key}={x.Value}"));

            // Create secure hash
            var secureHash = CreateSecureHash(queryString, vnpayHashSecret);
            queryString += $"&vnp_SecureHash={secureHash}";

            return $"{vnpayUrl}?{queryString}";
        }

        private string CreateSecureHash(string queryString, string secretKey)
        {
            using var hmacsha512 = new System.Security.Cryptography.HMACSHA512(Encoding.UTF8.GetBytes(secretKey));
            var hashBytes = hmacsha512.ComputeHash(Encoding.UTF8.GetBytes(queryString));
            return Convert.ToHexString(hashBytes).ToLower();
        }

        private string GetClientIpAddress()
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            if (string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
            }
            return ipAddress ?? "127.0.0.1";
        }
    }

    // DTOs
    public class CreatePaymentRequest
    {
        public int? OrderId { get; set; }
        public int? ProductId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentType { get; set; } = "Deposit";
    }

    public class CreateTestPaymentRequest
    {
        public string PaymentId { get; set; } = string.Empty;
        public int? OrderId { get; set; }
        public int? ProductId { get; set; }
        public int? SellerId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentType { get; set; } = "Deposit";
    }

    public class VNPayCallbackRequest
    {
        public string vnp_TxnRef { get; set; } = string.Empty;
        public string vnp_TransactionNo { get; set; } = string.Empty;
        public string vnp_ResponseCode { get; set; } = string.Empty;
        public string vnp_ResponseMessage { get; set; } = string.Empty;
        public string vnp_Amount { get; set; } = string.Empty;
        public string vnp_BankCode { get; set; } = string.Empty;
        public string vnp_BankTranNo { get; set; } = string.Empty;
        public string vnp_CardType { get; set; } = string.Empty;
        public string vnp_OrderInfo { get; set; } = string.Empty;
        public string vnp_PayDate { get; set; } = string.Empty;
        public string vnp_TmnCode { get; set; } = string.Empty;
        public string vnp_TransactionStatus { get; set; } = string.Empty;
        public string vnp_SecureHash { get; set; } = string.Empty;
    }
}
