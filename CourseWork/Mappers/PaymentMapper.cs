using CourseWork.DTOs;
using Сoursework.Models;

namespace CourseWork.Mappers;

public static class PaymentMapper
{
    public static PaymentDto ToDto(Payment p) => new()
    {
        Id = p.Id,
        VisitId = p.VisitId,
        PatientMedicalRecord = p.PatientMedicalRecord,
        TotalAmount = p.TotalAmount,
        PaidAmount = p.PaidAmount,
        RemainingAmount = p.RemainingAmount,
        Status = p.Status.ToString(),
        IssuedDate = p.IssuedDate,
        DueDate = p.DueDate
    };
}