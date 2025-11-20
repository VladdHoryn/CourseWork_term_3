namespace CourseWork.DTOs;

public class VisitCreateDto
{
    public string PatientId { get; set; }                 // ID пацієнта (для контролера)
    public int PatientMedicalRecord { get; set; }        // Номер мед. картки пацієнта
    public DateTime VisitDate { get; set; }              // Дата візиту

    // Медична інформація
    public string Anamnesis { get; set; }               // Анамнез
    public string Diagnosis { get; set; }               // Діагноз
    public string Treatment { get; set; }               // Лікування
    public string? Recommendations { get; set; }       // Рекомендації (необов'язково)

    // Вартість
    public decimal ServiceCost { get; set; }            // Вартість послуг
    public decimal MedicationCost { get; set; }         // Вартість ліків
}