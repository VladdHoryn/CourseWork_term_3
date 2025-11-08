using CourseWork.DTOs;
using Сoursework.Models;

namespace CourseWork.Mappers;

public class VisitMapper
{
    public static Visit ToVisit(VisitRequestDto dto, int patientMedicalRecord, string specialistId)
    {
        return new Visit(
            patientMedicalRecord,
            specialistId,
            dto.VisitDate,
            Enum.Parse<VisitStatus>(dto.Status),
            dto.IsFirstVisit,
            dto.Anamnesis,
            dto.Diagnosis,
            dto.Treatment,
            dto.Recommendations,
            dto.ServiceCost,
            dto.MedicationCost
        );
    }
    
    public static VisitResponseDto ToResponse(Visit visit)
    {
        return new VisitResponseDto
        {
            Id = visit.Id.ToString(),
            PatientMedicalRecord = visit.PatientMedicalRecord,
            SpecialistId = visit.SpecialistId,
            VisitDate = visit.VisitDate,
            Status = visit.Status.ToString(),
            IsFirstVisit = visit.IsFirstVisit,
            Anamnesis = visit.Anamnesis,
            Diagnosis = visit.Diagnosis,
            Treatment = visit.Treatment,
            Recommendations = visit.Recommendations,
            ServiceCost = visit.ServiceCost,
            MedicationCost = visit.MedicationCost
        };
    }

    public static void ApplyUpdate(Visit visit, VisitUpdateDto dto)
    {
        visit.UpdateMedicalInfo(dto.Anamnesis, dto.Diagnosis, dto.Treatment, dto.Recommendations);
        visit.SetCosts(dto.ServiceCost, dto.MedicationCost);
        visit.SetStatus_string(dto.Status);
    }
}