namespace BE.API.DTOs.Request
{
    public class ReviewRequest
    {
        public int OrderId { get; set; }
        public int RevieweeId { get; set; }
        public int Rating { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
