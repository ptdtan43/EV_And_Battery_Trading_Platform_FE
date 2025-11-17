using EVTB_Backend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Use PascalCase (default)
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true; // Allow case-insensitive matching
    });
// ✅ FIX: Configure SignalR with CORS support
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true; // Enable detailed errors for debugging
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database Configuration
builder.Services.AddDbContext<EVTBContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), 
        sqlOptions => sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null)),
    ServiceLifetime.Scoped);

// JWT Authentication Configuration
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];
var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.Zero
        };
        
        // Add event handlers for debugging and SignalR token from query
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                // ✅ FIX: Handle token from query string for SignalR
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
                {
                    context.Token = accessToken!;
                }
                // ✅ FIX: Also try Authorization header as fallback
                else if (string.IsNullOrEmpty(context.Token))
                {
                    var authHeader = context.Request.Headers["Authorization"].ToString();
                    if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                    {
                        context.Token = authHeader.Substring("Bearer ".Length);
                    }
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"JWT Authentication failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine($"JWT Token validated successfully for user: {context.Principal?.Identity?.Name}");
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                Console.WriteLine($"JWT Challenge: {context.Error} - {context.ErrorDescription}");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
        {
            var user = context.User;
            var roleClaim = user.FindFirst("roleId");
            return roleClaim != null && roleClaim.Value == "1";
        });
    });
});

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", 
                "http://localhost:5174",  // ✅ Added for current frontend
                "http://localhost:5177", 
                "http://localhost:5179", 
                "http://localhost:5181", 
                "http://localhost:5182")
              .AllowAnyHeader() // ✅ Includes SignalR headers like X-SignalR-User-Agent
              .AllowAnyMethod() // ✅ Includes OPTIONS for preflight
              .AllowCredentials() // ✅ CRITICAL: Required for SignalR with credentials
              .WithExposedHeaders("*"); // ✅ Expose all headers for SignalR
    });
    
    // Add default policy for development
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", 
                "http://localhost:5174",
                "http://localhost:5177", 
                "http://localhost:5179", 
                "http://localhost:5181", 
                "http://localhost:5182")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("*");
    });
});

// Register Services
// builder.Services.AddScoped<IEmailService, EmailService>();
// builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();

// Logging
builder.Services.AddLogging();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ✅ CRITICAL: Disable HTTPS redirection in development to avoid CORS issues
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// ✅ CRITICAL: CORS MUST be FIRST middleware (after Swagger) to handle preflight requests
// This ensures SignalR negotiation requests get proper CORS headers
app.UseCors("AllowFrontend");

// ✅ CRITICAL: Handle OPTIONS preflight requests explicitly for SignalR
// This is a fallback in case CORS middleware doesn't handle it properly
app.Use(async (context, next) =>
{
    var path = context.Request.Path;
    var method = context.Request.Method;
    var origin = context.Request.Headers["Origin"].ToString();
    
    // Log all requests to SignalR endpoints for debugging
    if (path.StartsWithSegments("/chatHub"))
    {
        Console.WriteLine($"🔍 SignalR Request: {method} {path}, Origin: {origin}");
    }
    
    // Handle OPTIONS requests explicitly (backup for CORS middleware)
    if (method == "OPTIONS")
    {
        var allowedOrigins = new[] { 
            "http://localhost:5173", 
            "http://localhost:5174",
            "http://localhost:5177", 
            "http://localhost:5179", 
            "http://localhost:5181", 
            "http://localhost:5182" 
        };
        
        if (!string.IsNullOrEmpty(origin) && allowedOrigins.Contains(origin))
        {
            Console.WriteLine($"✅ Explicitly handling OPTIONS preflight from origin: {origin} for path: {path}");
            // Set CORS headers explicitly
            if (!context.Response.Headers.ContainsKey("Access-Control-Allow-Origin"))
            {
                context.Response.Headers["Access-Control-Allow-Origin"] = origin;
            }
            if (!context.Response.Headers.ContainsKey("Access-Control-Allow-Credentials"))
            {
                context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
            }
            if (!context.Response.Headers.ContainsKey("Access-Control-Allow-Methods"))
            {
                context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH";
            }
            if (!context.Response.Headers.ContainsKey("Access-Control-Allow-Headers"))
            {
                context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, X-SignalR-User-Agent, Accept";
            }
            if (!context.Response.Headers.ContainsKey("Access-Control-Max-Age"))
            {
                context.Response.Headers["Access-Control-Max-Age"] = "86400";
            }
            context.Response.StatusCode = 200;
            await context.Response.WriteAsync("");
            return;
        }
    }
    await next();
});

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ✅ FIX: Map SignalR hub with explicit CORS policy
// SignalR negotiation endpoint will use CORS middleware automatically
app.MapHub<EVTB_Backend.RealTime.ChatHub>("/chatHub")
   .RequireCors("AllowFrontend");

app.Run();
