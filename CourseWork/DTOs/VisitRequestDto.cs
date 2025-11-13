namespace CourseWork.DTOs;

public class VisitRequestDto
{
    public string PatientId { get; set; }
    public int PatientMedicalRecord { get; set; }
    public string SpecialistId { get; set; }
    public DateTime VisitDate { get; set; }
    public string Status { get; set; }
    public bool IsFirstVisit { get; set; }
    public string Anamnesis { get; set; }
    public string Diagnosis { get; set; }
    public string Treatment { get; set; }
    public string? Recommendations { get; set; }
    public decimal ServiceCost { get; set; }
    public decimal MedicationCost { get; set; }
}