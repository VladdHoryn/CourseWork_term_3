using CourseWork.Repositories;
using Сoursework.Models;
using Сoursework.Repositories;

namespace Сoursework.Services;

public class AdministratorService : UserService
{
    private readonly AdministratorRepository _adminRepo;
    private readonly VisitRepository _visitRepo;
    private readonly PaymentRepository _paymentRepo;

    public AdministratorService(
        AdministratorRepository adminRepo,
        UserRepository userRepo,
        VisitRepository visitRepo,
        PaymentRepository paymentRepo)
        : base(userRepo)
    {
        _adminRepo = adminRepo;
        _visitRepo = visitRepo;
        _paymentRepo = paymentRepo;
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

    // -------------------- VISIT MANAGEMENT --------------------

    public List<Visit> GetAllVisits()
    {
        try
        {
            return _visitRepo.GetAllVisits();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to fetch visits: {ex.Message}");
            return new List<Visit>();
        }
    }

    public bool DeleteVisit(string id)
    {
        try
        {
            _visitRepo.DeleteVisit(id);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Cannot delete visit '{id}': {ex.Message}");
            return false;
        }
    }

    public decimal GetTotalVisitCostByYear(int recordNumber, int year)
    {
        try
        {
            return _visitRepo.GetPatientTotalCostByYear(recordNumber, year);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to calculate total visit cost: {ex.Message}");
            return 0;
        }
    }

    // -------------------- PAYMENT MANAGEMENT --------------------

    public List<Payment> GetAllPayments()
    {
        try
        {
            return _paymentRepo.GetAllPayments();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to fetch payments: {ex.Message}");
            return new List<Payment>();
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
            Console.WriteLine($"[Error] Cannot delete payment '{id}': {ex.Message}");
            return false;
        }
    }

    public decimal GetClinicRevenueByPeriod(DateTime start, DateTime end)
    {
        try
        {
            if (end < start)
                throw new ArgumentException("End date cannot be earlier than start date.");

            return _paymentRepo.GetClinicRevenueByPeriod(start, end);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to calculate revenue: {ex.Message}");
            return 0;
        }
    }

    // -------------------- SYSTEM ANALYTICS --------------------

    public (int totalUsers, int totalVisits, int totalPayments, decimal totalRevenue) GetSystemStatistics(DateTime start, DateTime end)
    {
        try
        {
            var totalUsers = base.GetAllUsers().Count;
            var totalVisits = _visitRepo.GetAllVisits().Count;
            var totalPayments = _paymentRepo.GetAllPayments().Count;
            var totalRevenue = _paymentRepo.GetClinicRevenueByPeriod(start, end);

            return (totalUsers, totalVisits, totalPayments, totalRevenue);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to collect statistics: {ex.Message}");
            return (0, 0, 0, 0);
        }
    }
}