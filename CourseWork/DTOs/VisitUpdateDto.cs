namespace CourseWork.DTOs;

public class VisitUpdateDto
{
    public string Anamnesis { get; set; }
    public string Diagnosis { get; set; }
    public string Treatment { get; set; }
    public string? Recommendations { get; set; }
    public decimal ServiceCost { get; set; }
    public decimal MedicationCost { get; set; }
    public string Status { get; set; }
}