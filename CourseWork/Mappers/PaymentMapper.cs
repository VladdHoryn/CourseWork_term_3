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
        DueDate = p.DueDate,
        LastPaymentDate = p.LastPaymentDate  
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
    
    public static Payment ToPayment(PaymentCreateDto dto, int patientMedicalRecord)
    {
        if (dto == null)
            throw new ArgumentNullException(nameof(dto), "PaymentCreateDto cannot be null.");

        if (string.IsNullOrWhiteSpace(dto.VisitId))
            throw new ArgumentException("VisitId must be provided.", nameof(dto.VisitId));

        if (dto.Amount <= 0)
            throw new ArgumentException("TotalAmount must be greater than zero.", nameof(dto.Amount));

        var payment = new Payment
        {
            VisitId = dto.VisitId,
            PatientMedicalRecord = patientMedicalRecord,
            TotalAmount = dto.Amount,
            PaidAmount = 0,
            RemainingAmount = dto.Amount,
            IssuedDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30), // стандартний термін
            Status = PaymentStatus.Pending
        };

        return payment;
    }
}