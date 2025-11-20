using CourseWork.Repositories;
using MongoDB.Bson;
using Сoursework.Models;

namespace Сoursework.Services;

public class SpecialistService : UserService
{
    private readonly SpecialistRepository _specialistRepository;
    private readonly PaymentService _paymentService;
    private readonly VisitService _visitService;
    private readonly PatientRepository _patientRepository;

    public SpecialistService(
        SpecialistRepository repo,
        PaymentService paymentService,
        VisitService visitService,
        PatientRepository patientRepository)
        : base(repo)
    {
        _specialistRepository = repo;
        _paymentService = paymentService;
        _visitService = visitService;
        _patientRepository = patientRepository;
    }

    // =====================================================================
    // ================== STATIC DATA ABOUT SPECIALISTS ====================
    // =====================================================================

    public List<User> GetAllSpecialists()
    {
        var specialists = _specialistRepository.GetAllSpecialists();
        return specialists.OrderBy(s => s.FullName).ToList();
    }

    public List<User> GetBySpecialty(string specialty)
    {
        if (string.IsNullOrWhiteSpace(specialty))
            throw new ArgumentException("Specialty cannot be empty.");

        return _specialistRepository.GetBySpecialty(specialty);
    }

    public int CountBySpecialty(string specialty)
    {
        if (string.IsNullOrWhiteSpace(specialty))
            throw new ArgumentException("Specialty cannot be empty.");

        return _specialistRepository.CountBySpecialty(specialty);
    }

    public List<User> GetDoctorsBySpecialty(string specialty)
    {
        if (string.IsNullOrWhiteSpace(specialty))
            throw new ArgumentException("Specialty cannot be empty.");

        var doctors = _specialistRepository.GetDoctorsBySpecialty(specialty);

        if (doctors.Count == 0)
            Console.WriteLine($"No doctors found for specialty: {specialty}");

        return doctors;
    }

    public Dictionary<string, int> GetAllDoctorsGroupedBySpecialty()
    {
        var grouped = _specialistRepository.GetAllDoctorsGroupedBySpecialty();

        if (grouped.Count == 0)
            Console.WriteLine("No specialists found in the system.");

        return grouped;
    }


    // =====================================================================
    // ====================== VISIT MANAGEMENT =============================
    // =====================================================================

    public List<Visit> GetAllVisitsForSpecialist(string specialistId)
    {
        return _visitService
            .GetAllVisits()
            .Where(v => v.SpecialistId == specialistId)
            .ToList();
    }

    public Visit GetVisitForSpecialist(string specialistId, string visitId)
    {
        var visit = _visitService.GetVisitById(visitId);

        if (visit.SpecialistId != specialistId)
            throw new UnauthorizedAccessException("You can access only your own visits.");

        return visit;
    }

    public bool CreateVisitBySpecialist(string specialistId, Visit visit)
    {
        try
        {
            visit.SpecialistId = specialistId;

            if (!visit.IsValid())
                throw new ArgumentException("Visit data is invalid.");

            return _visitService.CreateVisit(visit);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SpecialistService] CreateVisit failed: {ex.Message}");
            return false;
        }
    }

    public bool UpdateVisitBySpecialist(string specialistId, string visitId, Visit updated)
    {
        try
        {
            var existing = _visitService.GetVisitById(visitId);

            if (existing.SpecialistId != specialistId)
                throw new UnauthorizedAccessException("You can update only your own visits.");

            updated.SpecialistId = specialistId;

            return _visitService.UpdateVisit(visitId, updated);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SpecialistService] UpdateVisit failed: {ex.Message}");
            return false;
        }
    }

    public bool ChangeVisitStatus(string specialistId, string visitId, VisitStatus newStatus)
    {
        try
        {
            var visit = _visitService.GetVisitById(visitId);

            if (visit.SpecialistId != specialistId)
                throw new UnauthorizedAccessException("You can modify only your own visits.");

            visit.Status = newStatus;

            return _visitService.UpdateVisit(visitId, visit);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SpecialistService] ChangeVisitStatus failed: {ex.Message}");
            return false;
        }
    }


    // =====================================================================
    // ===================== PAYMENT MANAGEMENT (NEW!) =====================
    // =====================================================================

    /// Get payments belonging to this specialist through Visit → SpecialistId
    public List<Payment> GetPaymentsForSpecialist(string specialistId)
    {
        return _paymentService
            .GetAllPayments()
            .Where(p =>
            {
                if (!ObjectId.TryParse(p.VisitId, out _))
                    return false;

                var visit = _visitService.GetVisitById(p.VisitId);
                return visit != null && visit.SpecialistId == specialistId;
            })
            .ToList();
    }

    /// Get single payment only if Visit belongs to specialist
    public Payment GetPaymentForSpecialist(string specialistId, string paymentId)
    {
        var payment = _paymentService.GetPaymentById(paymentId);
        var visit = _visitService.GetVisitById(payment.VisitId);

        if (visit.SpecialistId != specialistId)
            throw new UnauthorizedAccessException("You can access only your own payments.");

        return payment;
    }

    /// Create payment — must validate that Visit belongs to specialist
    public bool CreatePaymentBySpecialist(string specialistId, Payment payment)
    {
        try
        {
            var visit = _visitService.GetVisitById(payment.VisitId);

            if (visit.SpecialistId != specialistId)
                throw new UnauthorizedAccessException("You can create payment only for your own visits.");

            payment.Validate();

            return _paymentService.CreatePayment(payment);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SpecialistService] CreatePayment failed: {ex.Message}");
            return false;
        }
    }

    /// Specialist can only cancel payment linked to his visit
    public bool CancelPaymentBySpecialist(string specialistId, string paymentId)
    {
        try
        {
            var payment = _paymentService.GetPaymentById(paymentId);
            var visit = _visitService.GetVisitById(payment.VisitId);

            if (visit.SpecialistId != specialistId)
                throw new UnauthorizedAccessException("You can cancel only payments for your own visits.");

            payment.Status = PaymentStatus.Cancelled;

            return _paymentService.UpdatePayment(paymentId, payment);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SpecialistService] CancelPayment failed: {ex.Message}");
            return false;
        }
    }
    
    // =====================================================================
// ======================= PATIENT MANAGEMENT ===========================
// =====================================================================

    public List<User> GetAllPatients()
    {
        var patients = _patientRepository.GetAllPatients();
        return patients.OrderBy(p => p.FullName).ToList();
    }

    public User? GetPatientByMedicalRecord(int medicalRecordNumber)
    {
        var patient = _patientRepository.GetPatientByMedicalRecord(medicalRecordNumber);

        if (patient == null)
            Console.WriteLine($"Patient with record {medicalRecordNumber} not found.");

        return patient;
    }

    public List<User> SearchPatientsBySurname(string surname)
    {
        if (string.IsNullOrWhiteSpace(surname))
            throw new ArgumentException("Surname cannot be empty.");

        return _patientRepository.GetBySurname(surname);
    }

    public List<User> GetPatientsByFilters(
        DateTime? birthDateFrom = null,
        DateTime? birthDateTo = null,
        string? specialistId = null,
        string? healthStatus = null)
    {
        var result = _patientRepository.GetPatientsByFilters(
            birthDateFrom, birthDateTo, specialistId, healthStatus);

        if (result.Count == 0)
            Console.WriteLine("No patients found matching the filters.");

        return result;
    }
}
