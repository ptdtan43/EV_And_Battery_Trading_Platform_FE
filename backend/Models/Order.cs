using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EVTB_Backend.Models
{
    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int ProductId { get; set; }

        public int? SellerId { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderStatus { get; set; } = "Pending";

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal DepositAmount { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public DateTime? FinalPaymentDueDate { get; set; }

        public DateTime? CompletedDate { get; set; }

        // Transaction confirmation fields
        public bool SellerConfirmed { get; set; } = false;
        public DateTime? SellerConfirmedDate { get; set; }
        public bool AdminConfirmed { get; set; } = false;
        public DateTime? AdminConfirmedDate { get; set; }
        public string? AdminNotes { get; set; }
        public string? RefundOption { get; set; } // "refund" or "no_refund"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("SellerId")]
        public virtual User? Seller { get; set; }

        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;
    }
}
