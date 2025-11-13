using Сoursework.Models;

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
    
    public static VisitDto ToDto(Visit v, User specialist)
    {
        return new VisitDto
        {
            Id = v.Id.ToString(),
            PatientMedicalRecord = v.PatientMedicalRecord,
            SpecialistFullName = specialist?.FullName ?? "Unknown specialist",
            VisitDate = v.VisitDate,
            IsFirstVisit = v.IsFirstVisit,
            Diagnosis = v.Diagnosis,
            ServiceCost = v.ServiceCost,
            MedicationCost = v.MedicationCost,
            TotalCost = v.ServiceCost + v.MedicationCost,
            Status = v.Status.ToString()
        };
    }
}