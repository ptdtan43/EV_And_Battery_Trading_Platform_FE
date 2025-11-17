using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EVTB_Backend.Models
{
    public class Payment
    {
        [Key]
        [MaxLength(50)]
        public string PaymentId { get; set; } = string.Empty;

        [Required]
        public int UserId { get; set; }

        public int? OrderId { get; set; }

        public int? ProductId { get; set; }

        public int? SellerId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? PayoutAmount { get; set; }

        [Required]
        [MaxLength(50)]
        public string PaymentType { get; set; } = "Deposit";

        [Required]
        [MaxLength(50)]
        public string PaymentStatus { get; set; } = "Pending";

        [MaxLength(1000)]
        public string? PaymentUrl { get; set; }

        [MaxLength(50)]
        public string? VNPayTransactionId { get; set; }

        [MaxLength(10)]
        public string? VNPayResponseCode { get; set; }

        [MaxLength(500)]
        public string? VNPayMessage { get; set; }

        public DateTime? FinalPaymentDueDate { get; set; }

        public DateTime? CompletedDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }

        [ForeignKey("SellerId")]
        public virtual User? Seller { get; set; }
    }
}
