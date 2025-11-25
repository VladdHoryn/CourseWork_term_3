using CourseWork.DTOs;
using CourseWork.Repositories;
using Сoursework.Models;
using Сoursework.Repositories;
using RegistrationRequest = CourseWork.Models.RegistrationRequest;

namespace Сoursework.Services;

public class AdministratorService : UserService
{
    private readonly AdministratorRepository _adminRepo;
    private readonly SpecialistRepository _specialistRepository;
    private readonly PatientRepository _patientRepository;
    private readonly VisitService _visitService;
    private readonly PaymentService _paymentService;
    private readonly RegistrationRequestService _requestService;

    public AdministratorService(
        AdministratorRepository adminRepo,
        UserRepository userRepo,
        VisitService visitService,
        PaymentService paymentService,
        RegistrationRequestService requestService,
        SpecialistRepository repo,
        PatientRepository patientRepository)
        : base(userRepo)
    {
        _adminRepo = adminRepo ?? throw new ArgumentNullException(nameof(adminRepo));
        _visitService = visitService ?? throw new ArgumentNullException(nameof(visitService));
        _paymentService = paymentService ?? throw new ArgumentNullException(nameof(paymentService));
        _requestService = requestService ?? throw new ArgumentNullException(nameof(requestService));
        _specialistRepository = repo;
        _patientRepository = patientRepository;
    }

    // -------------------- ADMINISTRATIVE USER MANAGEMENT --------------------

    public List<User> GetAllAdmins()
    {
        try
        {
            return _adminRepo.GetAllAdmins();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to retrieve admins: {ex.Message}");
            return new List<User>();
        }
    }

    public bool DeleteUserById(string id)
    {
        try
        {
            _adminRepo.DeleteUserById(id);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Cannot delete user by ID '{id}': {ex.Message}");
            return false;
        }
    }
    
    public List<User> GetAllSpecialists()
    {
        var specialists = _specialistRepository.GetAllSpecialists();
        return specialists.OrderBy(s => s.FullName).ToList();
    }
    
    public List<User> GetAllPatients()
    {
        var patients = _patientRepository.GetAllPatients();
        return patients.OrderBy(p => p.FullName).ToList();
    }

    // -------------------- VISIT MANAGEMENT --------------------

    public List<Visit> GetAllVisits() => _visitService.GetAllVisits();

    public Visit GetVisitById(string id) => _visitService.GetVisitById(id);

    public bool CreateVisit(Visit visit) => _visitService.CreateVisit(visit);

    public bool UpdateVisit(string id, Visit updatedVisit) => _visitService.UpdateVisit(id, updatedVisit);

    public bool DeleteVisit(string id) => _visitService.DeleteVisit(id);

    public decimal GetTotalVisitCostByYear(int recordNumber, int year) =>
        _visitService.GetPatientTotalCostByYear(recordNumber, year);

    // -------------------- PAYMENT MANAGEMENT --------------------

    public List<Payment> GetAllPayments() => _paymentService.GetAllPayments();

    public Payment GetPaymentById(string id) => _paymentService.GetPaymentById(id);

    public bool CreatePayment(Payment payment) => _paymentService.CreatePayment(payment);

    public bool UpdatePayment(string id, Payment updated) => _paymentService.UpdatePayment(id, updated);

    public bool DeletePayment(string id) => _paymentService.DeletePayment(id);

    public decimal GetClinicRevenueByPeriod(DateTime start, DateTime end) =>
        _paymentService.GetClinicRevenueByPeriod(start, end);
    
    // -------------------- REGISTRATION REQUESTS (Admin responsibilities) --------------------
    public List<RegistrationRequest> GetPendingRequests()
    {
        return _requestService.GetPendingRequests();
    }

    public bool ApproveRegistration(string requestId, Role initialRole = Role.Patient)
    {
        try
        {
            return _requestService.ApproveRequest(requestId, initialRole);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] ApproveRegistration failed: {ex.Message}");
            return false;
        }
    }

    public bool RejectRegistration(string requestId)
    {
        try
        {
            return _requestService.RejectRequest(requestId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] RejectRegistration failed: {ex.Message}");
            return false;
        }
    }

    // -------------------- SYSTEM ANALYTICS --------------------

    public (int totalUsers, int totalVisits, int totalPayments, decimal totalRevenue) GetSystemStatistics(DateTime start, DateTime end)
    {
        try
        {
            var totalUsers = base.GetAllUsers().Count;
            var totalVisits = _visitService.GetAllVisits().Count;
            var totalPayments = _paymentService.GetAllPayments().Count;
            var totalRevenue = _paymentService.GetClinicRevenueByPeriod(start, end);

            return (totalUsers, totalVisits, totalPayments, totalRevenue);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to collect statistics: {ex.Message}");
            return (0, 0, 0, 0);
        }
    }
    
    public double GetAveragePatientsPerDay(
        string? specialistId = null,
        string? specialty = null)
    {
        var allVisits = GetAllVisits();

        if (!string.IsNullOrWhiteSpace(specialistId))
        {
            allVisits = allVisits
                .Where(v => v.SpecialistId == specialistId)
                .ToList();
        }

        if (!string.IsNullOrWhiteSpace(specialty))
        {
            var specialists = GetAllSpecialists()
                .Where(s => s.Speciality == specialty)
                .Select(s => s.Id)
                .ToList();

            allVisits = allVisits
                .Where(v => specialists.Contains(v.SpecialistId))
                .ToList();
        }

        if (!allVisits.Any())
            return 0;

        // Групуємо за датою
        var grouped = allVisits
            .GroupBy(v => v.VisitDate.Date)
            .Select(g => g.Count())
            .ToList();

        double totalPatients = grouped.Sum();
        double totalDays = grouped.Count;

        return totalPatients / totalDays;
    }
    
    public decimal GetPatientMedicationPaymentsByPeriod(int patientMedicalRecord, DateTime start, DateTime end)
    {
        if (end < start) return 0;
        return _paymentService.GetPatientMedicationPaymentsByPeriod(patientMedicalRecord, start, end);
    }
    
    public decimal GetPatientTotalCostByYear(int patientMedicalRecord, int year, ref decimal[] monthlyCosts)
    {
        var allVisits = _visitService.GetAllVisits()
            .Where(v => v.PatientMedicalRecord == patientMedicalRecord && v.VisitDate.Year == year)
            .ToList();

        if (!allVisits.Any())
        {
            monthlyCosts = new decimal[12];
            return 0;
        }

        decimal total = 0;
        foreach (var visit in allVisits)
        {
            Console.WriteLine($"Visit: {visit.Id}, Service: {visit.ServiceCost}, Med: {visit.MedicationCost}, Date: {visit.VisitDate}");
            int monthIndex = visit.VisitDate.Month - 1;
            monthlyCosts[monthIndex] += visit.TotalCost;
            total += visit.TotalCost;
        }

        return total;
    }
}