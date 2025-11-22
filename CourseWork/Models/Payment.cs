using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Сoursework.Models;

[BsonIgnoreExtraElements]
public class Payment
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonElement("visitId")]
    public string VisitId { get; set; }
    [BsonElement("patientMedicalRecord")]
    public int PatientMedicalRecord { get; set; }

    [BsonElement("totalAmount")]
    public decimal TotalAmount { get; set; }
    [BsonElement("paidAmount")]
    public decimal PaidAmount { get; set; }
    [BsonElement("remainingAmount")]
    public decimal RemainingAmount { get; set; }

    [BsonElement("issuedDate")]
    public DateTime IssuedDate { get; set; }
    [BsonElement("dueDate")]
    public DateTime DueDate { get; set; }
    [BsonElement("lastPaymentDate")]
    public DateTime? LastPaymentDate { get; set; }

    [BsonElement("status")]
    public PaymentStatus Status { get; set; }

    public Payment()
    {
        Id = ObjectId.GenerateNewId().ToString();
        IssuedDate = DateTime.UtcNow;
        DueDate = DateTime.UtcNow.AddDays(30);
        PaidAmount = 0;
        Status = PaymentStatus.Pending;
        // LastPaymentDate = DateTime.UtcNow;
    }

    public Payment(string visitId, int patientMedicalRecord, decimal totalAmount, decimal paidAmount) : this()
    {
        VisitId = visitId;
        PatientMedicalRecord = patientMedicalRecord;
        TotalAmount = totalAmount;
        RemainingAmount = totalAmount;
        PaidAmount = paidAmount;
    }

    public Payment(string visitId, int patientMedicalRecord, decimal totalAmount, int dueDays, decimal paidAmount)
        : this(visitId, patientMedicalRecord, totalAmount, paidAmount)
    {
        DueDate = DateTime.UtcNow.AddDays(dueDays);
    }

    public bool ProcessPayment(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Payment amount must be greater than zero", nameof(amount));

        if (amount > RemainingAmount)
            throw new InvalidOperationException(
                $"Payment amount ({amount}) exceeds remaining amount ({RemainingAmount})");

        if (!CanAcceptPayment())
            throw new InvalidOperationException($"Cannot accept payment. Current status: {Status}");

        PaidAmount += amount;
        RemainingAmount -= amount;
        LastPaymentDate = DateTime.UtcNow;

        UpdateStatus();

        return IsFullyPaid();
    }

    public void AddPartialPayment(decimal amount)
    {
        ProcessPayment(amount);
    }

    public bool IsFullyPaid()
    {
        return RemainingAmount <= 0 && Status == PaymentStatus.Paid;
    }

    public bool IsPartiallyPaid()
    {
        return PaidAmount > 0 && RemainingAmount > 0;
    }

    public bool IsOverdue()
    {
        return DateTime.UtcNow > DueDate && RemainingAmount > 0;
    }

    public bool IsPending()
    {
        return Status == PaymentStatus.Pending && PaidAmount == 0;
    }

    public bool CanAcceptPayment()
    {
        return Status != PaymentStatus.Paid && Status != PaymentStatus.Cancelled;
    }

    public decimal CalculateRemainingAmount()
    {
        return TotalAmount - PaidAmount;
    }

    public decimal GetPaymentProgress()
    {
        if (TotalAmount == 0) return 0;
        return (PaidAmount / TotalAmount) * 100;
    }

    public int GetDaysUntilDue()
    {
        return (DueDate - DateTime.UtcNow).Days;
    }

    public int GetDaysOverdue()
    {
        if (!IsOverdue()) return 0;
        return (DateTime.UtcNow - DueDate).Days;
    }
    
    public void UpdateStatus()
    {
        if (RemainingAmount <= 0)
        {
            Status = PaymentStatus.Paid;
            RemainingAmount = 0; // Гарантуємо, що не буде від'ємних значень
        }
        else if (PaidAmount > 0 && RemainingAmount > 0)
        {
            Status = PaymentStatus.PartiallyPaid;
        }
        else if (IsOverdue())
        {
            Status = PaymentStatus.Overdue;
        }
        else
        {
            Status = PaymentStatus.Pending;
        }
    }

    public void MarkAsCancelled()
    {
        if (PaidAmount > 0)
            throw new InvalidOperationException("Cannot cancel payment with existing payments. Refund required.");

        Status = PaymentStatus.Cancelled;
    }

    public void ExtendDueDate(int additionalDays)
    {
        if (additionalDays <= 0)
            throw new ArgumentException("Additional days must be greater than zero", nameof(additionalDays));

        DueDate = DueDate.AddDays(additionalDays);

        if (Status == PaymentStatus.Overdue && !IsOverdue())
        {
            UpdateStatus();
        }
    }
    
    public string GetPaymentSummary()
    {
        return $"Payment #{Id}: {PaidAmount:C} / {TotalAmount:C} ({GetPaymentProgress():F1}%) - Status: {Status}";
    }
    
    public bool Validate()
    {
        if (TotalAmount < 0)
            throw new InvalidOperationException("Total amount cannot be negative");

        if (PaidAmount < 0)
            throw new InvalidOperationException("Paid amount cannot be negative");

        if (PaidAmount > TotalAmount)
            throw new InvalidOperationException("Paid amount cannot exceed total amount");

        if (RemainingAmount != CalculateRemainingAmount())
            throw new InvalidOperationException("Remaining amount calculation mismatch");

        return true;
    }

    public override string ToString()
    {
        return $"Payment for Visit {VisitId}: {PaidAmount:C}/{TotalAmount:C} - {Status}";
    }
}

public enum PaymentStatus
{
    Pending,
    Paid,
    PartiallyPaid,
    Overdue,
    Cancelled
}