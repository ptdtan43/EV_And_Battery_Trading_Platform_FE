using EVTB_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace EVTB_Backend.Data
{
    public class EVTBContext : DbContext
    {
        public EVTBContext(DbContextOptions<EVTBContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Rating> Ratings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Password).IsRequired();
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Avatar).HasMaxLength(500);
                entity.Property(e => e.RoleId).IsRequired();
                entity.Property(e => e.AccountStatus).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ResetPasswordToken).HasMaxLength(1000);
                
                // Create unique index on Email
                entity.HasIndex(e => e.Email).IsUnique();
                
                // Create index on ResetPasswordToken for performance
                entity.HasIndex(e => e.ResetPasswordToken);
                entity.HasIndex(e => e.ResetPasswordTokenExpiry);
            });

            // Configure Order entity
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.OrderId);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.ProductId).IsRequired();
                entity.Property(e => e.SellerId);
                entity.Property(e => e.OrderStatus).IsRequired().HasMaxLength(50);
                entity.Property(e => e.DepositAmount).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalAmount).IsRequired().HasColumnType("decimal(18,2)");
                
                // Foreign key relationships
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.NoAction);
                    
                entity.HasOne(e => e.Seller)
                    .WithMany()
                    .HasForeignKey(e => e.SellerId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // Configure Payment entity
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.PaymentId);
                entity.Property(e => e.PaymentId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.SellerId);
                entity.Property(e => e.Amount).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.PayoutAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PaymentType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PaymentStatus).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PaymentUrl).HasMaxLength(1000);
                entity.Property(e => e.VNPayTransactionId).HasMaxLength(50);
                entity.Property(e => e.VNPayResponseCode).HasMaxLength(10);
                entity.Property(e => e.VNPayMessage).HasMaxLength(500);
                
                // Foreign key relationships
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.NoAction);
                    
                entity.HasOne(e => e.Order)
                    .WithMany()
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.NoAction);
                    
                entity.HasOne(e => e.Seller)
                    .WithMany()
                    .HasForeignKey(e => e.SellerId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // Configure Product entity
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.ProductId);
                entity.Property(e => e.SellerId).IsRequired();
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Price).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.VerificationStatus).HasMaxLength(50);
                entity.Property(e => e.RejectionReason).HasMaxLength(1000);
                entity.Property(e => e.ProductType).HasMaxLength(50);
                entity.Property(e => e.VehicleType).HasMaxLength(50);
                entity.Property(e => e.LicensePlate).HasMaxLength(20);
                entity.Property(e => e.WarrantyPeriod).HasMaxLength(100);
                entity.Property(e => e.BatteryType).HasMaxLength(50);
                entity.Property(e => e.BatteryHealth).HasMaxLength(50);
                entity.Property(e => e.Capacity).HasMaxLength(50);
                entity.Property(e => e.Voltage).HasMaxLength(50);
                entity.Property(e => e.Bms).HasMaxLength(50);
                entity.Property(e => e.CellType).HasMaxLength(50);
                
                // Foreign key relationship
                entity.HasOne(e => e.Seller)
                    .WithMany()
                    .HasForeignKey(e => e.SellerId)
                    .OnDelete(DeleteBehavior.NoAction);
            });


            // Seed data
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    UserId = 1,
                    Email = "admin@gmail.com",
                    Password = BCrypt.Net.BCrypt.HashPassword("123456"),
                    FullName = "Admin User",
                    Phone = "0123456789",
                    RoleId = 1,
                    AccountStatus = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );

            // Configure Rating entity
            modelBuilder.Entity<Rating>(entity =>
            {
                entity.HasKey(e => e.RatingId);
                entity.Property(e => e.OrderId).IsRequired();
                entity.Property(e => e.ProductId).IsRequired();
                entity.Property(e => e.BuyerId).IsRequired();
                entity.Property(e => e.SellerId).IsRequired();
                entity.Property(e => e.RatingValue).IsRequired();
                entity.Property(e => e.Comment).HasMaxLength(1000);
                
                // Foreign key relationships
                entity.HasOne(e => e.Order)
                    .WithMany()
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.NoAction);
                    
                entity.HasOne(e => e.Product)
                    .WithMany()
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.NoAction);
                    
                entity.HasOne(e => e.Buyer)
                    .WithMany()
                    .HasForeignKey(e => e.BuyerId)
                    .OnDelete(DeleteBehavior.NoAction);
                    
                entity.HasOne(e => e.Seller)
                    .WithMany()
                    .HasForeignKey(e => e.SellerId)
                    .OnDelete(DeleteBehavior.NoAction);
            });
        }
    }
}
