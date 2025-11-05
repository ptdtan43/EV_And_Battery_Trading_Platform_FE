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
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<ChatController> _logger;

        public ChatController(EVTBContext context, ILogger<ChatController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Tạo hoặc lấy cuộc trò chuyện giữa buyer và seller về một sản phẩm
        /// </summary>
        [HttpPost("start")]
        public async Task<ActionResult<object>> StartChat([FromBody] StartChatRequest request)
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
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int buyerId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Validate product exists
                var product = await _context.Products
                    .Include(p => p.Seller)
                    .FirstOrDefaultAsync(p => p.ProductId == request.ProductId);

                if (product == null)
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });
                }

                var sellerId = product.SellerId;

                // Check if user is trying to chat with themselves
                if (buyerId == sellerId)
                {
                    return BadRequest(new { message = "Bạn không thể liên hệ với chính mình" });
                }

                // Check if chat already exists
                var existingChat = await _context.Chats
                    .Include(c => c.Product)
                    .Include(c => c.Buyer)
                    .Include(c => c.Seller)
                    .FirstOrDefaultAsync(c => c.ProductId == request.ProductId && 
                                            c.BuyerId == buyerId && 
                                            c.SellerId == sellerId);

                if (existingChat != null)
                {
                    return Ok(new
                    {
                        chatId = existingChat.ChatId,
                        product = new
                        {
                            id = existingChat.Product.ProductId,
                            title = existingChat.Product.Title,
                            price = existingChat.Product.Price,
                            image = existingChat.Product.ImageData
                        },
                        seller = new
                        {
                            id = existingChat.Seller.UserId,
                            name = existingChat.Seller.FullName,
                            email = existingChat.Seller.Email,
                            phone = existingChat.Seller.Phone
                        },
                        buyer = new
                        {
                            id = existingChat.Buyer.UserId,
                            name = existingChat.Buyer.FullName,
                            email = existingChat.Buyer.Email,
                            phone = existingChat.Buyer.Phone
                        },
                        status = existingChat.Status,
                        createdAt = existingChat.CreatedAt
                    });
                }

                // Create new chat
                var chat = new Chat
                {
                    ProductId = request.ProductId,
                    BuyerId = buyerId,
                    SellerId = sellerId,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Chats.Add(chat);
                await _context.SaveChangesAsync();

                // Load the created chat with related data
                var createdChat = await _context.Chats
                    .Include(c => c.Product)
                    .Include(c => c.Buyer)
                    .Include(c => c.Seller)
                    .FirstOrDefaultAsync(c => c.ChatId == chat.ChatId);

                return Ok(new
                {
                    chatId = createdChat.ChatId,
                    product = new
                    {
                        id = createdChat.Product.ProductId,
                        title = createdChat.Product.Title,
                        price = createdChat.Product.Price,
                        image = createdChat.Product.ImageData
                    },
                    seller = new
                    {
                        id = createdChat.Seller.UserId,
                        name = createdChat.Seller.FullName,
                        email = createdChat.Seller.Email,
                        phone = createdChat.Seller.Phone
                    },
                    buyer = new
                    {
                        id = createdChat.Buyer.UserId,
                        name = createdChat.Buyer.FullName,
                        email = createdChat.Buyer.Email,
                        phone = createdChat.Buyer.Phone
                    },
                    status = createdChat.Status,
                    createdAt = createdChat.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error starting chat for product {request.ProductId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo cuộc trò chuyện" });
            }
        }

        /// <summary>
        /// Lấy danh sách cuộc trò chuyện của user
        /// </summary>
        [HttpGet("conversations")]
        public async Task<ActionResult<IEnumerable<object>>> GetConversations()
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var conversations = await _context.Chats
                    .Include(c => c.Product)
                    .Include(c => c.Buyer)
                    .Include(c => c.Seller)
                    .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                    .Where(c => c.BuyerId == userId || c.SellerId == userId)
                    .OrderByDescending(c => c.UpdatedAt)
                    .Select(c => new
                    {
                        chatId = c.ChatId,
                        product = new
                        {
                            id = c.Product.ProductId,
                            title = c.Product.Title,
                            price = c.Product.Price,
                            image = c.Product.ImageData
                        },
                        otherUser = c.BuyerId == userId ? new
                        {
                            id = c.Seller.UserId,
                            name = c.Seller.FullName,
                            email = c.Seller.Email,
                            phone = c.Seller.Phone
                        } : new
                        {
                            id = c.Buyer.UserId,
                            name = c.Buyer.FullName,
                            email = c.Buyer.Email,
                            phone = c.Buyer.Phone
                        },
                        lastMessage = c.Messages.FirstOrDefault() != null ? new
                        {
                            content = c.Messages.First().Content,
                            senderId = c.Messages.First().SenderId,
                            timestamp = c.Messages.First().CreatedAt,
                            isRead = c.Messages.First().IsRead
                        } : null,
                        status = c.Status,
                        updatedAt = c.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(conversations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversations");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách cuộc trò chuyện" });
            }
        }

        /// <summary>
        /// Lấy tin nhắn của một cuộc trò chuyện
        /// </summary>
        [HttpGet("{chatId}/messages")]
        public async Task<ActionResult<IEnumerable<object>>> GetMessages(int chatId)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Check if user is part of this chat
                var chat = await _context.Chats
                    .FirstOrDefaultAsync(c => c.ChatId == chatId && (c.BuyerId == userId || c.SellerId == userId));

                if (chat == null)
                {
                    return NotFound(new { message = "Không tìm thấy cuộc trò chuyện" });
                }

                var messages = await _context.ChatMessages
                    .Include(m => m.Sender)
                    .Where(m => m.ChatId == chatId)
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new
                    {
                        messageId = m.MessageId,
                        content = m.Content,
                        senderId = m.SenderId,
                        senderName = m.Sender.FullName,
                        timestamp = m.CreatedAt,
                        isRead = m.IsRead
                    })
                    .ToListAsync();

                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting messages for chat {chatId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy tin nhắn" });
            }
        }

        /// <summary>
        /// Gửi tin nhắn trong cuộc trò chuyện
        /// </summary>
        [HttpPost("{chatId}/messages")]
        public async Task<ActionResult<object>> SendMessage(int chatId, [FromBody] SendMessageRequest request)
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

                // Check if user is part of this chat
                var chat = await _context.Chats
                    .FirstOrDefaultAsync(c => c.ChatId == chatId && (c.BuyerId == userId || c.SellerId == userId));

                if (chat == null)
                {
                    return NotFound(new { message = "Không tìm thấy cuộc trò chuyện" });
                }

                // Create new message
                var message = new ChatMessage
                {
                    ChatId = chatId,
                    SenderId = userId,
                    Content = request.Content,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ChatMessages.Add(message);

                // Update chat's UpdatedAt timestamp
                chat.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    messageId = message.MessageId,
                    content = message.Content,
                    senderId = message.SenderId,
                    timestamp = message.CreatedAt,
                    isRead = message.IsRead
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending message to chat {chatId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi gửi tin nhắn" });
            }
        }

        /// <summary>
        /// Đánh dấu tin nhắn là đã đọc
        /// </summary>
        [HttpPut("{chatId}/messages/{messageId}/read")]
        public async Task<ActionResult> MarkAsRead(int chatId, int messageId)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Check if user is part of this chat
                var chat = await _context.Chats
                    .FirstOrDefaultAsync(c => c.ChatId == chatId && (c.BuyerId == userId || c.SellerId == userId));

                if (chat == null)
                {
                    return NotFound(new { message = "Không tìm thấy cuộc trò chuyện" });
                }

                // Find the message
                var message = await _context.ChatMessages
                    .FirstOrDefaultAsync(m => m.MessageId == messageId && m.ChatId == chatId);

                if (message == null)
                {
                    return NotFound(new { message = "Không tìm thấy tin nhắn" });
                }

                // Only mark as read if the message is not from the current user
                if (message.SenderId != userId)
                {
                    message.IsRead = true;
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Tin nhắn đã được đánh dấu là đã đọc" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking message {messageId} as read");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi đánh dấu tin nhắn" });
            }
        }
    }

    // Request models
    public class StartChatRequest
    {
        public int ProductId { get; set; }
    }

    public class SendMessageRequest
    {
        public string Content { get; set; } = string.Empty;
    }
}
