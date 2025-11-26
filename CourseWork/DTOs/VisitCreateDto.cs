namespace CourseWork.DTOs;

public class VisitCreateDto
{
    public string PatientId { get; set; }           
    public int PatientMedicalRecord { get; set; }      
    public DateTime VisitDate { get; set; }          

    // Медична інформація
    public string Anamnesis { get; set; }            
    public string Diagnosis { get; set; }            
    public string Treatment { get; set; }              
    public string? Recommendations { get; set; }      

    // Вартість
    public decimal ServiceCost { get; set; }        
    public decimal MedicationCost { get; set; }        
}