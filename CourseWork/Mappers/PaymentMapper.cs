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
    public static PaymentResponseDto ToResponseDto(Payment payment)
    {
        return new PaymentResponseDto
        {
            Id = payment.Id,
            VisitId = payment.VisitId,
            PatientMedicalRecord = payment.PatientMedicalRecord,
            TotalAmount = payment.TotalAmount,
            PaidAmount = payment.PaidAmount,
            RemainingAmount = payment.RemainingAmount,
            IssuedDate = payment.IssuedDate,
            DueDate = payment.DueDate,
            LastPaymentDate = payment.LastPaymentDate,
            Status = payment.Status.ToString()
        };
    }
}