namespace CourseWork.DTOs;

public class VisitDto
{
    public string Id { get; set; }
    public int PatientMedicalRecord { get; set; }
    public string SpecialistFullName { get; set; }
    public DateTime VisitDate { get; set; }
    public bool IsFirstVisit { get; set; }
    public string Diagnosis { get; set; }
    public decimal ServiceCost { get; set; }
    public decimal MedicationCost { get; set; }
    public decimal TotalCost { get; set; }
    public string Status { get; set; }
}