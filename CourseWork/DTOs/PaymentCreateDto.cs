namespace CourseWork.DTOs;

public class PaymentCreateDto
{
    public string VisitId { get; set; }
    public decimal Amount { get; set; }
    public int PatientMedicalRecord { get; set; }
}