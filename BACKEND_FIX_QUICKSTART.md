# ⚡ Backend Quick Fix - 5 phút setup SignalR

## 🎯 TL;DR - Chỉ cần làm 2 bước này:

### Bước 1: Sửa CORS (dòng 179-181 trong Program.cs)

**Thay từ:**
```csharp
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));
```

**Thành:**
```csharp
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.WithOrigins("http://localhost:5173", "http://localhost:3000")
          .AllowAnyMethod()
          .AllowAnyHeader()
          .AllowCredentials()));
```

### Bước 2: Thêm JWT query string support (sau dòng 25)

**Thêm vào trong `.AddJwtBearer(options => { ... })`:**

```csharp
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;
        
        if (!string.IsNullOrEmpty(accessToken) && 
            path.StartsWithSegments("/chatHub"))
        {
            context.Token = accessToken;
        }
        return Task.CompletedTask;
    }
};
```

---

## ✅ Test nhanh

Chạy backend, mở browser console và paste:

```javascript
const conn = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5044/chatHub?access_token=YOUR_TOKEN")
  .build();
await conn.start();
console.log("✅ Works! ID:", conn.connectionId);
```

Nếu thấy connection ID → **DONE!** ✅

---

## 📸 Screenshot vị trí code

```
BE.API/
  ├── Program.cs  ← SỬA FILE NÀY
  │   ├── Line ~25: AddJwtBearer  ← THÊM Events
  │   └── Line ~179: AddCors      ← SỬA CORS
  ├── Hubs/
  │   └── ChatHub.cs  ← KHÔNG SỬA
  └── Controllers/
      ├── ChatController.cs  ← KHÔNG SỬA
      └── MessageController.cs  ← KHÔNG SỬA
```

---

**Chỉ sửa 1 file, 2 chỗ, 5 phút done!** 🚀


