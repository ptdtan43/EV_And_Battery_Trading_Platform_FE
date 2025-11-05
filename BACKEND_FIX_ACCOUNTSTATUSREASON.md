# Hướng dẫn sửa Backend để trả về AccountStatusReason

## Vấn đề

Backend không trả về `AccountStatusReason` trong response của endpoint `GET /api/admin/users`. 
Frontend không thể hiển thị lý do hạn chế tài khoản.

## Nguyên nhân

DTO `AdminUserListItemResponse` có thể thiếu property `AccountStatusReason`, hoặc JSON serialization đang skip null values.

## Giải pháp

### Bước 1: Kiểm tra DTO `AdminUserListItemResponse`

Đảm bảo DTO có property `AccountStatusReason`:

```csharp
public class AdminUserListItemResponse
{
    public int Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }
    public string Status { get; set; }
    public string AccountStatusReason { get; set; } // ✅ Đảm bảo có property này
    public string Reason { get; set; } // ✅ Backup field
    public DateTime? CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
```

### Bước 2: Kiểm tra JSON Serialization Settings

Nếu backend đang skip null values, cần cấu hình serializer để bao gồm null values:

**Option 1: Trong `Program.cs` hoặc `Startup.cs`:**

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never; // Không skip null
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; // Convert sang camelCase
    });
```

**Option 2: Trong Controller, đảm bảo giá trị được set:**

```csharp
var items = userList.Select(u => new AdminUserListItemResponse
{
    Id = u.UserId,
    FullName = u.FullName,
    Email = u.Email,
    Role = NormalizeRoleNameToUi(u.Role != null ? u.Role.RoleName : null),
    Status = NormalizeDbStatusToUi(u.AccountStatus),
    AccountStatusReason = u.AccountStatusReason ?? string.Empty, // ✅ Đảm bảo không null
    Reason = u.AccountStatusReason ?? string.Empty, // ✅ Backup field
    CreatedAt = u.CreatedDate,
    LastLoginAt = null
})
.ToList();
```

### Bước 3: Kiểm tra trong Controller

Trong `UserController.cs`, method `AdminGetUsers`, đảm bảo:

```csharp
var items = userList.Select(u => new AdminUserListItemResponse
{
    // ... other fields
    AccountStatusReason = u.AccountStatusReason ?? string.Empty, // ✅ Không để null
    Reason = u.AccountStatusReason ?? string.Empty, // ✅ Backup
    // ... other fields
})
.ToList();
```

### Bước 4: Test

Sau khi sửa, test lại:
1. Reload trang Admin Dashboard
2. Kiểm tra Network tab → Response của `GET /api/admin/users`
3. Xem response có chứa `accountStatusReason` (camelCase) hoặc `AccountStatusReason` (PascalCase) không
4. Xem giá trị của field đó có đúng không

## Debug

Nếu vẫn không hoạt động, thêm debug log trong Controller:

```csharp
var items = userList.Select(u => {
    var item = new AdminUserListItemResponse
    {
        Id = u.UserId,
        FullName = u.FullName,
        Email = u.Email,
        Role = NormalizeRoleNameToUi(u.Role != null ? u.Role.RoleName : null),
        Status = NormalizeDbStatusToUi(u.AccountStatus),
        AccountStatusReason = u.AccountStatusReason ?? string.Empty,
        Reason = u.AccountStatusReason ?? string.Empty,
        CreatedAt = u.CreatedDate,
        LastLoginAt = null
    };
    
    // Debug log
    if (u.AccountStatus == "Suspended" || u.AccountStatus == "Deleted")
    {
        Console.WriteLine($"[DEBUG] User {u.UserId}: AccountStatusReason = '{u.AccountStatusReason}'");
        Console.WriteLine($"[DEBUG] Response Item AccountStatusReason = '{item.AccountStatusReason}'");
    }
    
    return item;
}).ToList();
```

Sau đó kiểm tra console output để xem giá trị thực tế.

