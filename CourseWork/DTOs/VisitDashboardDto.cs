namespace CourseWork.DTOs;

public class VisitDashboardDto
{
    public string Id { get; set; }

    public string PatientName { get; set; }

    public DateTime VisitDate { get; set; }

    public string Diagnosis { get; set; }

    public string Status { get; set; }

    public decimal TotalCost { get; set; }
}