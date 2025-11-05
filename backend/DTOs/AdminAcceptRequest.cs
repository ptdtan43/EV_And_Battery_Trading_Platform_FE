using System.ComponentModel.DataAnnotations;

namespace EVTB_Backend.DTOs
{
    public class AdminAcceptRequest
    {
        [Required(ErrorMessage = "ProductId is required")]
        [Range(1, int.MaxValue, ErrorMessage = "ProductId must be greater than 0")]
        public int ProductId { get; set; }
    }
}
