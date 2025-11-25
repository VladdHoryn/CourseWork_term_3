using Сoursework.Models;
using Сoursework.Repositories;

namespace Сoursework.Services;

public class PaymentService
{
    private readonly PaymentRepository _paymentRepo;

    public PaymentService(PaymentRepository paymentRepo)
    {
        _paymentRepo = paymentRepo;
    }

    public List<Payment> GetAllPayments()
    {
        try
        {
            return _paymentRepo.GetAllPayments();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Fetch payments failed: {ex.Message}");
            return new List<Payment>();
        }
    }

    public Payment GetPaymentById(string id)
    {
        try
        {
            var payment = _paymentRepo.GetPaymentById(id);
            if (payment == null)
                throw new KeyNotFoundException($"Payment with ID {id} not found.");
            return payment;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] GetPaymentById failed: {ex.Message}");
            throw;
        }
    }

    public bool CreatePayment(Payment payment)
    {
        try
        {
            payment.Validate();
            _paymentRepo.CreatePayment(payment);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] CreatePayment failed: {ex.Message}");
            return false;
        }
    }

    public bool UpdatePayment(string id, Payment updated)
    {
        try
        {
            updated.Validate();
            _paymentRepo.UpdatePayment(id, updated);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] UpdatePayment failed: {ex.Message}");
            return false;
        }
    }

    public bool DeletePayment(string id)
    {
        try
        {
            _paymentRepo.DeletePayment(id);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] DeletePayment failed: {ex.Message}");
            return false;
        }
    }

    public decimal GetClinicRevenueByPeriod(DateTime start, DateTime end)
    {
        try
        {
            if (end < start)
                throw new ArgumentException("End date cannot be before start date.");
            return _paymentRepo.GetClinicRevenueByPeriod(start, end);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] GetClinicRevenueByPeriod failed: {ex.Message}");
            return 0;
        }
    }
    
    public decimal GetPatientMedicationPaymentsByPeriod(int patientMedicalRecord, DateTime start, DateTime end)
    {
        try
        {
            if (end < start)
                throw new ArgumentException("End date cannot be before start date.");

            return _paymentRepo.GetPatientMedicationPaymentsByPeriod(patientMedicalRecord, start, end);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] GetPatientMedicationPaymentsByPeriod failed for patient {patientMedicalRecord}: {ex.Message}");
            return 0;
        }
    }
}
