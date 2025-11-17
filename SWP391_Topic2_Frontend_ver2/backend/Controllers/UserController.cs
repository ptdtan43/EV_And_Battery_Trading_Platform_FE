using EVTB_Backend.Data;
using EVTB_Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace EVTB_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly EVTBContext _context;
        private readonly ILogger<UserController> _logger;
        private readonly IConfiguration _configuration;

        public UserController(EVTBContext context, ILogger<UserController> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Đăng nhập người dùng
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<object>> Login([FromBody] LoginRequest request)
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

                _logger.LogInformation($"Login attempt for email: {request.Email}");

                // Tìm user theo email
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (user == null)
                {
                    _logger.LogWarning($"User not found for email: {request.Email}");
                    return Unauthorized(new { message = "Email hoặc mật khẩu không đúng" });
                }

                // Kiểm tra mật khẩu (giả sử đã hash)
                if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                {
                    _logger.LogWarning($"Invalid password for email: {request.Email}");
                    return Unauthorized(new { message = "Email hoặc mật khẩu không đúng" });
                }

                // Kiểm tra trạng thái tài khoản
                if (user.AccountStatus != "Active")
                {
                    _logger.LogWarning($"Inactive account login attempt: {request.Email}");
                    return Unauthorized(new { message = "Tài khoản đã bị khóa" });
                }

                // Tạo JWT token
                var token = GenerateJwtToken(user);

                _logger.LogInformation($"Successful login for user: {user.Email}");

                return Ok(new
                {
                    token = token,
                    user = new
                    {
                        id = user.UserId,
                        userId = user.UserId,
                        email = user.Email,
                        fullName = user.FullName,
                        full_name = user.FullName,
                        phone = user.Phone,
                        avatar = user.Avatar,
                        roleId = user.RoleId,
                        roleName = user.RoleId == 1 ? "Admin" : "User",
                        role = user.RoleId,
                        accountStatus = user.AccountStatus
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during login for email: {request.Email}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi đăng nhập" });
            }
        }

        /// <summary>
        /// Đăng ký người dùng mới
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<object>> Register([FromBody] RegisterRequest request)
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

                _logger.LogInformation($"Registration attempt for email: {request.Email}");

                // Kiểm tra email đã tồn tại
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (existingUser != null)
                {
                    _logger.LogWarning($"Email already exists: {request.Email}");
                    return BadRequest(new { message = "Email đã được sử dụng" });
                }

                // Tạo user mới
                var newUser = new User
                {
                    Email = request.Email,
                    Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    FullName = request.FullName,
                    Phone = request.Phone ?? "",
                    RoleId = request.RoleId ?? 2, // Mặc định là User
                    AccountStatus = request.AccountStatus ?? "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"User registered successfully: {newUser.Email}");

                // Tạo JWT token
                var token = GenerateJwtToken(newUser);

                return Ok(new
                {
                    token = token,
                    user = new
                    {
                        id = newUser.UserId,
                        userId = newUser.UserId,
                        email = newUser.Email,
                        fullName = newUser.FullName,
                        full_name = newUser.FullName,
                        phone = newUser.Phone,
                        avatar = newUser.Avatar,
                        roleId = newUser.RoleId,
                        roleName = newUser.RoleId == 1 ? "Admin" : "User",
                        role = newUser.RoleId,
                        accountStatus = newUser.AccountStatus
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during registration for email: {request.Email}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi đăng ký" });
            }
        }

        /// <summary>
        /// Lấy danh sách tất cả users (chỉ admin)
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Select(u => new
                    {
                        id = u.UserId,
                        userId = u.UserId,
                        email = u.Email,
                        fullName = u.FullName,
                        full_name = u.FullName,
                        phone = u.Phone,
                        avatar = u.Avatar,
                        roleId = u.RoleId,
                        roleName = u.RoleId == 1 ? "Admin" : "User",
                        role = u.RoleId,
                        accountStatus = u.AccountStatus,
                        createdAt = u.CreatedAt,
                        updatedAt = u.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users list");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách người dùng" });
            }
        }

        /// <summary>
        /// Lấy thông tin user theo ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> GetUser(int id)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == id);

                if (user == null)
                {
                    return NotFound(new { message = "Không tìm thấy người dùng" });
                }

                return Ok(new
                {
                    id = user.UserId,
                    userId = user.UserId,
                    email = user.Email,
                    fullName = user.FullName,
                    full_name = user.FullName,
                    phone = user.Phone,
                    avatar = user.Avatar,
                    roleId = user.RoleId,
                    roleName = user.RoleId == 1 ? "Admin" : "User",
                    role = user.RoleId,
                    accountStatus = user.AccountStatus,
                    createdAt = user.CreatedAt,
                    updatedAt = user.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user with ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin người dùng" });
            }
        }

        /// <summary>
        /// Cập nhật thông tin user
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> UpdateUser(int id, [FromBody] UpdateUserRequest request)
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

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == id);

                if (user == null)
                {
                    return NotFound(new { message = "Không tìm thấy người dùng" });
                }

                // Cập nhật thông tin
                user.FullName = request.FullName ?? user.FullName;
                user.Phone = request.Phone ?? user.Phone;
                user.Avatar = request.Avatar ?? user.Avatar;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"User updated successfully: {user.Email}");

                return Ok(new
                {
                    id = user.UserId,
                    userId = user.UserId,
                    email = user.Email,
                    fullName = user.FullName,
                    full_name = user.FullName,
                    phone = user.Phone,
                    avatar = user.Avatar,
                    roleId = user.RoleId,
                    roleName = user.RoleId == 1 ? "Admin" : "User",
                    role = user.RoleId,
                    accountStatus = user.AccountStatus,
                    updatedAt = user.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user with ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật thông tin người dùng" });
            }
        }

        /// <summary>
        /// Tạo JWT token
        /// </summary>
        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var expiryInMinutes = int.Parse(jwtSettings["ExpiryInMinutes"] ?? "60");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.RoleId == 1 ? "Admin" : "User"),
                new Claim("roleId", user.RoleId.ToString()),
                new Claim("accountStatus", user.AccountStatus)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryInMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // DTOs
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public int? RoleId { get; set; }
        public string? AccountStatus { get; set; }
    }

    public class UpdateUserRequest
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Avatar { get; set; }
    }
}
