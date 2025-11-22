namespace CourseWork.DTOs;

public class PaymentUpdateDto
{
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public DateTime IssuedDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? LastPaymentDate { get; set; }
    public string Status { get; set; }
}