using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Сoursework.Models;

[BsonIgnoreExtraElements]
public class Visit
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public ObjectId Id { get; set; }

    [BsonElement("patientMedicalRecord")]
    public int PatientMedicalRecord { get; set; }
    [BsonElement("specialistId")]
    public string SpecialistId { get; set; }
    [BsonElement("visitDate")]
    public DateTime VisitDate { get; set; }
    [BsonElement("isFirstVisit")]
    public bool IsFirstVisit { get; set; }
    [BsonElement("anamnesis")]
    public string Anamnesis { get; set; }
    [BsonElement("diagnosis")]
    public string Diagnosis { get; set; }
    [BsonElement("treatment")]
    public string Treatment { get; set; }
    [BsonElement("recommendations")]
    public string Recommendations { get; set; }
    
    
    [BsonElement("serviceCost")]
    public decimal ServiceCost { get; set; }
    [BsonElement("medicationCost")]
    public decimal MedicationCost { get; set; }
    [BsonElement("status")]
    public VisitStatus Status { get; set; }
    
    [BsonIgnore]
    public decimal TotalCost => ServiceCost + MedicationCost;
    public Visit()
    {
        Id = ObjectId.GenerateNewId();
    }

    public Visit(int patientMedicalRecord, string specialistId, DateTime visitDate, VisitStatus status): this()
    {
        this.PatientMedicalRecord = patientMedicalRecord;
        this.SpecialistId = specialistId;
        this.VisitDate = visitDate;
        this.Status = status;
    }

    public Visit(int patientMedicalRecord, string specialistId, DateTime visitDate, VisitStatus status, 
        bool isFirstVisit, string anamnesis, string diagnosis, string treatment, string? recommendations)
        : this(patientMedicalRecord, specialistId, visitDate, status)
    {
        this.IsFirstVisit = isFirstVisit;
        this.Anamnesis = anamnesis;
        this.Diagnosis = diagnosis;
        this.Treatment = treatment;
        if(!string.IsNullOrEmpty(recommendations))
            this.Recommendations = recommendations;
        else
        {
            this.Recommendations = "No recomendations provided";
        }
    }

    public Visit(int patientMedicalRecord, string specialistId, DateTime visitDate, VisitStatus status,
        bool isFirstVisit, string anamnesis, string diagnosis, string treatment, string? recommendations, decimal serviceCost, decimal medicationCost)
        : this(patientMedicalRecord, specialistId, visitDate, status, isFirstVisit, anamnesis, diagnosis, treatment, recommendations)
    {
        this.ServiceCost = serviceCost;
        this.MedicationCost = medicationCost;
    }

    public void SetPatientMedicalRecord(int medicalRecord)
    {
        PatientMedicalRecord = medicalRecord;
    }

    public void SetSpecialistId(string specialistId)
    {
        if (string.IsNullOrWhiteSpace(specialistId))
            throw new ArgumentException("Specialist ID cannot be empty");
        SpecialistId = specialistId;
    }

    public void SetVisitDate(DateTime visitDate)
    {
        VisitDate = visitDate;
    }

    public void SetIsFirstVisit(bool isFirstVisit)
    {
        IsFirstVisit = isFirstVisit;
    }

    public void SetAnamnesis(string anamnesis)
    {
        Anamnesis = anamnesis ?? string.Empty;
    }

    public void SetDiagnosis(string diagnosis)
    {
        Diagnosis = diagnosis ?? string.Empty;
    }

    public void SetTreatment(string treatment)
    {
        Treatment = treatment ?? string.Empty;
    }

    public void SetRecommendations(string? recommendations)
    {
        if (!string.IsNullOrEmpty(recommendations))
            Recommendations = recommendations;
        else
            Recommendations = "No recomendations provided";
    }

    public void SetServiceCost(decimal serviceCost)
    {
        if (serviceCost < 0)
            throw new ArgumentException("Service cost cannot be negative");
        ServiceCost = serviceCost;
    }

    public void SetMedicationCost(decimal medicationCost)
    {
        if (medicationCost < 0)
            throw new ArgumentException("Medication cost cannot be negative");
        MedicationCost = medicationCost;
    }

    public void SetCosts(decimal serviceCost, decimal medicationCost)
    {
        SetServiceCost(serviceCost);
        SetMedicationCost(medicationCost);
    }

    public void UpdateMedicalInfo(string anamnesis, string diagnosis, string treatment, string? recommendations = null)
    {
        SetAnamnesis(anamnesis);
        SetDiagnosis(diagnosis);
        SetTreatment(treatment);
        SetRecommendations(recommendations);
    }

    public void SetStatus(VisitStatus status)
    {
        Status = status;
    }
    
    public void SetStatus_string(string status)
    {
        try
        {
            this.Status = Enum.Parse<VisitStatus>(status);
        }
        catch (ArgumentException e)
        {
            this.Status = VisitStatus.NoShow;
        }
    }

    public bool IsValid()
    {
        return PatientMedicalRecord > 0 
               && !string.IsNullOrWhiteSpace(SpecialistId)
               && VisitDate != default
               && ServiceCost >= 0
               && MedicationCost >= 0;
    }

    public bool IsCompleted()
    {
        return Status == VisitStatus.Completed;
    }

    public bool CanBeModified()
    {
        return Status != VisitStatus.Completed && Status != VisitStatus.Cancelled;
    }

    public string GetFormattedTotalCost(string currencySymbol = "₴")
    {
        return $"{TotalCost:F2} {currencySymbol}";
    }
}

public enum VisitStatus
{
    Scheduled,
    InProgress, 
    Completed,
    Cancelled,
    NoShow
}