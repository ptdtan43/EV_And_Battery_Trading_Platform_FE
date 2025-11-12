# 🔧 Cập nhật UserController.cs để hỗ trợ Staff Role

## 🚨 Vấn đề

Trong code `UserController.cs` bạn vừa gửi:

1. **Login endpoint** trả về `Role = user.RoleId?.ToString() ?? "Member"` → Trả về "3" thay vì "Staff"
2. **GenerateJwtToken** chỉ thêm `RoleId.ToString()` vào JWT claims → JWT chỉ có "3" không có "Staff"
3. Frontend đang expect `role: "Staff"` nhưng nhận được `Role: "3"`

## 📋 Cần cập nhật

### 1. Login Endpoint - Trả về RoleName từ Database

**Tìm dòng này (khoảng dòng 100):**
```csharp
return Ok(new LoginResponse
{
    Role = user.RoleId?.ToString() ?? "Member",
    Token = token,
    AccountId = user.UserId.ToString()
});
```

**Thay bằng:**
```csharp
// ✅ Load Role từ database để lấy RoleName
using var context = new EvandBatteryTradingPlatformContext();
var role = context.UserRoles.FirstOrDefault(r => r.RoleId == user.RoleId);
var roleName = role?.RoleName ?? "Member";

return Ok(new LoginResponse
{
    Role = roleName,  // ✅ Trả về "Staff", "Admin", "Member" thay vì số
    Token = token,
    AccountId = user.UserId.ToString()
});
```

**Hoặc tốt hơn, include Role khi query user:**
```csharp
// Ở đầu Login method, thay đổi query:
var user = await _context.Users
    .Include(u => u.Role)  // ✅ Include Role navigation property
    .FirstOrDefaultAsync(u => u.Email == request.Email);

// Sau đó trong response:
return Ok(new LoginResponse
{
    Role = user.Role?.RoleName ?? "Member",  // ✅ Lấy RoleName từ navigation property
    Token = token,
    AccountId = user.UserId.ToString()
});
```

### 2. GenerateJwtToken - Thêm RoleName vào JWT Claims

**Tìm dòng này (khoảng dòng 120):**
```csharp
if (user.RoleId.HasValue)
{
    claims.Add(new Claim(ClaimTypes.Role, user.RoleId.Value.ToString()));
}
```

**Thay bằng:**
```csharp
if (user.RoleId.HasValue)
{
    // ✅ Thêm cả RoleId (số) và RoleName (string) vào claims
    claims.Add(new Claim(ClaimTypes.Role, user.RoleId.Value.ToString()));
    
    // ✅ Load RoleName từ database
    using var context = new EvandBatteryTradingPlatformContext();
    var role = context.UserRoles.FirstOrDefault(r => r.RoleId == user.RoleId.Value);
    if (role != null)
    {
        claims.Add(new Claim("RoleName", role.RoleName));  // ✅ Thêm RoleName vào claims
    }
}
```

**Hoặc tốt hơn, truyền Role vào GenerateJwtToken:**
```csharp
// Trong Login method, include Role:
var user = await _context.Users
    .Include(u => u.Role)
    .FirstOrDefaultAsync(u => u.Email == request.Email);

// Truyền user (đã có Role) vào GenerateJwtToken:
var token = GenerateJwtToken(user);

// Trong GenerateJwtToken:
private string GenerateJwtToken(User user)
{
    var claims = new List<Claim> {
        new Claim(ClaimTypes.Name, user.FullName ?? "Unknown"),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim("UserId", user.UserId.ToString())
    };

    if (user.RoleId.HasValue)
    {
        claims.Add(new Claim(ClaimTypes.Role, user.RoleId.Value.ToString()));
        
        // ✅ Lấy RoleName từ navigation property
        if (user.Role != null)
        {
            claims.Add(new Claim("RoleName", user.Role.RoleName));  // ✅ "Staff", "Admin", "Member"
        }
    }
    
    // ... rest of the code
}
```

### 3. ProcessOAuthLogin - Cập nhật OAuth login

**Tìm các chỗ trả về LoginResponse trong ProcessOAuthLogin:**
```csharp
return Task.FromResult<IActionResult>(Ok(new LoginResponse
{
    Role = existingOAuthUser.RoleId?.ToString() ?? "Member",  // ❌
    Token = token,
    AccountId = existingOAuthUser.UserId.ToString()
}));
```

**Thay bằng:**
```csharp
// ✅ Load Role từ database
using var context = new EvandBatteryTradingPlatformContext();
var role = context.UserRoles.FirstOrDefault(r => r.RoleId == existingOAuthUser.RoleId);
var roleName = role?.RoleName ?? "Member";

return Task.FromResult<IActionResult>(Ok(new LoginResponse
{
    Role = roleName,  // ✅ "Staff", "Admin", "Member"
    Token = token,
    AccountId = existingOAuthUser.UserId.ToString()
}));
```

## ✅ Code mẫu hoàn chỉnh

### Login Method (Updated)

```csharp
[HttpPost("login")]
public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
{
    var user = _userRepo.GetAccountByEmailAndPassword(request.Email, request.Password);

    if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
    {
        return Unauthorized("Invalid email or password.");
    }

    // ✅ Load Role từ database
    using var context = new EvandBatteryTradingPlatformContext();
    var role = context.UserRoles.FirstOrDefault(r => r.RoleId == user.RoleId);
    var roleName = role?.RoleName ?? "Member";

    // Generate JWT Token (truyền user với Role nếu có)
    var token = GenerateJwtToken(user, role);

    return Ok(new LoginResponse
    {
        Role = roleName,  // ✅ "Staff", "Admin", "Member"
        Token = token,
        AccountId = user.UserId.ToString()
    });
}
```

### GenerateJwtToken Method (Updated)

```csharp
private string GenerateJwtToken(User user, UserRole? role = null)
{
    var claims = new List<Claim> {
        new Claim(ClaimTypes.Name, user.FullName ?? "Unknown"),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim("UserId", user.UserId.ToString())
    };

    if (user.RoleId.HasValue)
    {
        claims.Add(new Claim(ClaimTypes.Role, user.RoleId.Value.ToString()));
        
        // ✅ Thêm RoleName vào claims
        if (role != null)
        {
            claims.Add(new Claim("RoleName", role.RoleName));  // "Staff", "Admin", "Member"
        }
        else
        {
            // Fallback: Load từ database nếu không truyền vào
            using var context = new EvandBatteryTradingPlatformContext();
            var dbRole = context.UserRoles.FirstOrDefault(r => r.RoleId == user.RoleId.Value);
            if (dbRole != null)
            {
                claims.Add(new Claim("RoleName", dbRole.RoleName));
            }
        }
    }

    var secretKey = _configuration["JWT:SecretKey"] ?? "default-secret-key";
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var preparedToken = new JwtSecurityToken(
        issuer: _configuration["JWT:Issuer"],
        audience: _configuration["JWT:Audience"],
        claims: claims,
        expires: DateTime.Now.AddYears(100),
        signingCredentials: creds);

    return new JwtSecurityTokenHandler().WriteToken(preparedToken);
}
```

## 🔍 Kiểm tra sau khi cập nhật

1. **Test Login với Staff user:**
   - Login với email `staff@evtrading.com`
   - Kiểm tra response có `Role: "Staff"` (không phải "3")
   - Kiểm tra JWT token có claim `RoleName: "Staff"`

2. **Test Frontend:**
   - Đăng nhập với Staff user
   - Mở Console (F12) → Application → Local Storage → `evtb_auth`
   - Kiểm tra `user.role` hoặc `user.roleName` có giá trị "Staff"
   - Kiểm tra redirect đến `/staff`

## 📝 Lưu ý

- Nếu `User` model có navigation property `Role`, nên dùng `.Include(u => u.Role)` thay vì query riêng
- Đảm bảo database có Role với `RoleName = "Staff"` và `RoleId = 3`
- Tất cả các chỗ trả về `LoginResponse` đều cần cập nhật (Login, OAuth callbacks)


