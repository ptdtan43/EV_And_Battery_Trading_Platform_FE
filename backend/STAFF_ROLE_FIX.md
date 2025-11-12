# 🔧 Cập nhật Backend để hỗ trợ Staff Role

## 🚨 Vấn đề

Backend hiện tại chỉ trả về `roleName = "Admin"` hoặc `"User"`, không có `"Staff"`. Cần cập nhật để hỗ trợ Staff role (RoleId = 3).

## 📋 Cần cập nhật

### 1. UserController.cs - Login endpoint

**File:** `backend/Controllers/UserController.cs`

**Dòng 90:** Cập nhật logic trả về roleName

```csharp
// ❌ CŨ:
roleName = user.RoleId == 1 ? "Admin" : "User",

// ✅ MỚI:
roleName = user.RoleId == 1 ? "Admin" : (user.RoleId == 3 ? "Staff" : "User"),
```

**Hoặc tốt hơn, query từ UserRoles table:**
```csharp
var role = await _context.UserRoles.FirstOrDefaultAsync(r => r.RoleId == user.RoleId);
roleName = role?.RoleName ?? "User",
```

### 2. UserController.cs - GenerateJwtToken method

**Dòng 421:** Cập nhật JWT claims

```csharp
// ❌ CŨ:
new Claim(ClaimTypes.Role, user.RoleId == 1 ? "Admin" : "User"),

// ✅ MỚI:
new Claim(ClaimTypes.Role, user.RoleId == 1 ? "Admin" : (user.RoleId == 3 ? "Staff" : "User")),
```

**Hoặc query từ UserRoles:**
```csharp
var role = await _context.UserRoles.FirstOrDefaultAsync(r => r.RoleId == user.RoleId);
new Claim(ClaimTypes.Role, role?.RoleName ?? "User"),
```

### 3. Tất cả các endpoints trả về user data

Cần cập nhật tất cả các chỗ trả về `roleName`:
- Login (dòng 90)
- Register (dòng 249)
- GetUserById (dòng 282)
- UpdateUser (dòng 326)
- GetProfile (dòng 386)

### 4. Program.cs - Thêm StaffOnly policy

**File:** `backend/Program.cs`

Thêm policy `StaffOnly`:

```csharp
options.AddPolicy("StaffOnly", policy => 
    policy.RequireAssertion(context => 
        context.User.IsInRole("Staff") || 
        context.User.IsInRole("Admin")
    ));
```

## ✅ Checklist

- [ ] Cập nhật UserController.cs - Login endpoint (roleName)
- [ ] Cập nhật UserController.cs - GenerateJwtToken (JWT claims)
- [ ] Cập nhật tất cả endpoints trả về user data
- [ ] Thêm StaffOnly policy trong Program.cs
- [ ] Test đăng nhập với user có RoleId = 3
- [ ] Kiểm tra JWT token có chứa role "Staff"
- [ ] Test redirect đến /staff sau khi đăng nhập

## 🔍 Kiểm tra RoleId của Staff

```sql
-- Kiểm tra RoleId của Staff
SELECT * FROM UserRoles WHERE RoleName = 'Staff';

-- Nếu RoleId không phải 3, cập nhật:
UPDATE UserRoles SET RoleId = 3 WHERE RoleName = 'Staff';
```

## 📝 Lưu ý

- RoleId = 1: Admin
- RoleId = 2: Member/User (mặc định)
- RoleId = 3: Staff

Nếu RoleId của Staff trong database không phải 3, cần cập nhật logic kiểm tra trong frontend.


