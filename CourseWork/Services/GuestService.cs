using Сoursework.Models;
using Сoursework.Repositories;

namespace Сoursework.Services;

public class GuestService : UserService
{
    private readonly RegistrationRequestService _requestService;
    private readonly VisitService _visitService;
    private readonly PaymentService _paymentService;

    public GuestService(
        UserRepository userRepo,
        VisitService visitService,
        PaymentService paymentService,
        RegistrationRequestService requestService)
        : base(userRepo)
    {
        _visitService = visitService ?? throw new ArgumentNullException(nameof(visitService));
        _paymentService = paymentService ?? throw new ArgumentNullException(nameof(paymentService));
        _requestService = requestService ?? throw new ArgumentNullException(nameof(requestService));
    }

    // -------------------- VIEW SYSTEM DATA --------------------
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

    // -------------------- SEND REGISTRATION REQUEST --------------------
    public bool SendRegistrationRequest(string username, string password, string? fullName = null, string? phone = null, string? address = null)
    {
        try
        {
            bool result = _requestService.SubmitRegistrationRequest(username, password, fullName, phone, address);
            if (result)
                Console.WriteLine($"[Info] Registration request for '{username}' sent successfully.");
            else
                Console.WriteLine($"[Warning] Request for '{username}' could not be sent (possibly username already exists).");

            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to send registration request: {ex.Message}");
            return false;
        }
    }
}