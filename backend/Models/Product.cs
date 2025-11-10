using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EVTB_Backend.Models
{
    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required]
        public int SellerId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        [MaxLength(50)]
        public string? VerificationStatus { get; set; }

        [MaxLength(1000)]
        public string? RejectionReason { get; set; }

        [MaxLength(50)]
        public string? ProductType { get; set; }

        // Vehicle specific fields
        [MaxLength(50)]
        public string? VehicleType { get; set; }

        public int? ManufactureYear { get; set; }

        public int? Mileage { get; set; }

        [MaxLength(20)]
        public string? LicensePlate { get; set; }

        [MaxLength(100)]
        public string? WarrantyPeriod { get; set; }

        // Battery specific fields
        [MaxLength(50)]
        public string? BatteryType { get; set; }

        [MaxLength(50)]
        public string? BatteryHealth { get; set; }

        [MaxLength(50)]
        public string? Capacity { get; set; }

        [MaxLength(50)]
        public string? Voltage { get; set; }

        [MaxLength(50)]
        public string? Bms { get; set; }

        [MaxLength(50)]
        public string? CellType { get; set; }

        public int? CycleCount { get; set; }

        public DateTime? ApprovedDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("SellerId")]
        public virtual User Seller { get; set; } = null!;
    }
}
