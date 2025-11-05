# Hướng dẫn sửa Backend để lưu AccountStatusReason

## Vấn đề

Backend endpoint `AdminGetUsers` không trả về `AccountStatusReason` trong response, nên frontend không thể hiển thị lý do hạn chế tài khoản trong bảng "Các tài khoản bị hạn chế".

## Giải pháp

### 1. Sửa DTO `AdminUserListItemResponse`

Thêm property `AccountStatusReason` vào class `AdminUserListItemResponse`:

```csharp
public class AdminUserListItemResponse
{
    public int Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }
    public string Status { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string AccountStatusReason { get; set; } // ✅ Thêm dòng này
}
```

### 2. Sửa endpoint `AdminGetUsers` trong `UserController.cs`

Trong method `AdminGetUsers`, thêm `AccountStatusReason` vào phần select:

```csharp
var items = users.Skip((page - 1) * pageSize).Take(pageSize)
    .Select(u => new AdminUserListItemResponse
    {
        Id = u.UserId,
        FullName = u.FullName,
        Email = u.Email,
        Role = NormalizeRoleNameToUi(u.Role != null ? u.Role.RoleName : null),
        Status = NormalizeDbStatusToUi(u.AccountStatus),
        CreatedAt = u.CreatedDate,
        LastLoginAt = null,
        AccountStatusReason = u.AccountStatusReason // ✅ Thêm dòng này
    })
    .ToList();
```

## Kiểm tra

Sau khi sửa backend:
1. Gọi API `GET /api/admin/users` và kiểm tra response có chứa `accountStatusReason`
2. Frontend sẽ tự động hiển thị lý do trong bảng "Các tài khoản bị hạn chế"

