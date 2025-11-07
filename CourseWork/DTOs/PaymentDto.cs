namespace CourseWork.DTOs;

public class PaymentDto
{
    public string Id { get; set; }
    public string VisitId { get; set; }
    public int PatientMedicalRecord { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public string Status { get; set; }
    public DateTime IssuedDate { get; set; }
    public DateTime DueDate { get; set; }
}